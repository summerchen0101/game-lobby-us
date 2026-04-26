import {
  decodeGatewayResponse,
  encodeGatewayRequest,
  gatewayResponseToObject,
  isGatewaySuccessCode,
} from './gatewayWire'
import { getGatewayWsUrl } from '../lib/env'

export type GatewayWsConnectionState = 'idle' | 'connecting' | 'open' | 'closed'

export type GatewayWsResponseObject = ReturnType<typeof gatewayResponseToObject>

export type GatewayWsRequestPayload = {
  type: number
  data?: Uint8Array
  /** 併入該次 Request 的 RequestBasic（會蓋過同鍵的 getRequestBasicExtras） */
  basicExtras?: Record<string, unknown>
}

export type GatewayWsRequestFn = (
  req: GatewayWsRequestPayload,
) => Promise<GatewayWsResponseObject>

export type GatewayWsOptions = {
  /** 若設定則完全覆寫連線 URL（含 query）；除錯用 */
  url?: string
  /**
   * 併入連線 URL 的 query `token`（試玩可空字串）。
   * 未設定時沿用 `getGatewayWsUrl()` 規則（可保留 `VITE_WS_URL` 內既有 token）。
   */
  wsToken?: string | null
  /** 寫入 RequestBasic.clientVer；預設 web-alpha */
  clientVer?: string
  /** `request()` 逾時毫秒；預設 15000；<=0 則不設逾時 */
  requestTimeoutMs?: number
  /** 預設 25s；<=0 則不送 PING_PONG */
  heartbeatIntervalMs?: number
  /** 斷線後自動重連；預設 true */
  reconnect?: boolean
  initialReconnectDelayMs?: number
  maxReconnectDelayMs?: number
  /** 併入每則 Request 的 RequestBasic（如 token、userID）；`request()` 會再帶 timestamp、requestID */
  getRequestBasicExtras?: () => Record<string, unknown>
  onState?: (s: GatewayWsConnectionState) => void
  onResponse?: (msg: GatewayWsResponseObject) => void
  /** 連線成功（open）後呼叫；可在此發 LOBBY_GET 等 */
  onOpen?: (ctx: { request: GatewayWsRequestFn }) => void
  /** WebSocket 層錯誤 */
  onSocketError?: (ev: Event) => void
  /** 業務 code 非 200/204 時觸發（仍會先呼叫 onResponse） */
  onGatewayError?: (msg: GatewayWsResponseObject) => void
}

const PING_PONG = 0

type PendingEntry = {
  resolve: (v: GatewayWsResponseObject) => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout> | null
}

/** WebSocket `send` 在 DOM 型別上要求 `ArrayBuffer`，避免 `Uint8Array<ArrayBufferLike>` 不相容。 */
function asWsBinaryPayload(u8: Uint8Array): ArrayBuffer {
  return u8.slice().buffer
}

function randomRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createGatewayWs(options: GatewayWsOptions = {}) {
  let ws: WebSocket | null = null
  let state: GatewayWsConnectionState = 'idle'
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false
  let attempt = 0
  const pending = new Map<string, PendingEntry>()

  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? 25_000
  const reconnect = options.reconnect !== false
  const initialDelay = options.initialReconnectDelayMs ?? 1_000
  const maxDelay = options.maxReconnectDelayMs ?? 30_000
  const requestTimeoutMs = options.requestTimeoutMs ?? 15_000
  const defaultClientVer = options.clientVer?.trim() || 'web-alpha'

  function rejectAllPending(reason: Error) {
    for (const [, entry] of pending) {
      if (entry.timer !== null) clearTimeout(entry.timer)
      entry.reject(reason)
    }
    pending.clear()
  }

  function setState(next: GatewayWsConnectionState) {
    state = next
    options.onState?.(next)
  }

  function clearHeartbeat() {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function clearReconnect() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function buildPingRequest(): Uint8Array {
    const extras = options.getRequestBasicExtras?.() ?? {}
    const tokenBasic =
      options.wsToken !== undefined
        ? (options.wsToken ?? '')
        : String((extras as { token?: string }).token ?? '')
    return encodeGatewayRequest({
      basic: {
        ...extras,
        clientVer: (extras as { clientVer?: string }).clientVer ?? defaultClientVer,
        token: tokenBasic,
        timestamp: Date.now(),
        requestID: randomRequestId(),
      },
      type: PING_PONG,
      data: new Uint8Array(0),
    })
  }

  function sendPing() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(asWsBinaryPayload(buildPingRequest()))
    } catch (e) {
      console.warn('[gateway-ws] ping send failed', e)
    }
  }

  function startHeartbeat() {
    clearHeartbeat()
    if (heartbeatIntervalMs <= 0) return
    heartbeatTimer = setInterval(sendPing, heartbeatIntervalMs)
  }

  function handleMessage(data: ArrayBuffer) {
    const buf = new Uint8Array(data)
    const decoded = decodeGatewayResponse(buf)
    const obj = gatewayResponseToObject(decoded)
    const ridRaw = obj.basic?.requestID
    const rid = typeof ridRaw === 'string' ? ridRaw : ''
    if (rid && pending.has(rid)) {
      const entry = pending.get(rid)!
      pending.delete(rid)
      if (entry.timer !== null) {
        clearTimeout(entry.timer)
        entry.timer = null
      }
      entry.resolve(obj)
    }
    options.onResponse?.(obj)
    const code = String(obj.code ?? '')
    if (code && !isGatewaySuccessCode(code)) {
      options.onGatewayError?.(obj)
    }
  }

  function resolveConnectUrl(): string {
    const explicit = options.url?.trim()
    if (explicit) return explicit
    if (options.wsToken !== undefined) {
      return getGatewayWsUrl({ token: options.wsToken ?? '' })
    }
    return getGatewayWsUrl()
  }

  function request(req: GatewayWsRequestPayload): Promise<GatewayWsResponseObject> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('[gateway-ws] socket not open'))
    }
    const requestID = randomRequestId()
    const extras = {
      ...(options.getRequestBasicExtras?.() ?? {}),
      ...(req.basicExtras ?? {}),
    }
    const tokenBasic =
      options.wsToken !== undefined
        ? (options.wsToken ?? '')
        : String((extras as { token?: string }).token ?? '')
    const basic = {
      ...extras,
      clientVer: (extras as { clientVer?: string }).clientVer ?? defaultClientVer,
      token: tokenBasic,
      timestamp: Date.now(),
      requestID,
    }
    const payload = encodeGatewayRequest({
      basic,
      type: req.type,
      data: req.data ?? new Uint8Array(0),
    })

    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null
      if (requestTimeoutMs > 0) {
        timer = setTimeout(() => {
          pending.delete(requestID)
          reject(new Error(`[gateway-ws] request timeout: ${requestID}`))
        }, requestTimeoutMs)
      }
      pending.set(requestID, { resolve, reject, timer })
      try {
        ws!.send(asWsBinaryPayload(payload))
      } catch (e) {
        pending.delete(requestID)
        if (timer !== null) clearTimeout(timer)
        reject(
          e instanceof Error
            ? e
            : new Error('[gateway-ws] send failed'),
        )
      }
    })
  }

  function connectNow() {
    const url = resolveConnectUrl()
    closedByUser = false
    clearReconnect()
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    setState('connecting')
    const socket = new WebSocket(url)
    ws = socket
    socket.binaryType = 'arraybuffer'

    socket.onopen = () => {
      attempt = 0
      setState('open')
      sendPing()
      startHeartbeat()
      options.onOpen?.({ request })
    }

    socket.onmessage = (ev) => {
      if (ev.data instanceof ArrayBuffer) {
        handleMessage(ev.data)
      }
    }

    socket.onerror = (ev) => {
      options.onSocketError?.(ev)
    }

    socket.onclose = () => {
      clearHeartbeat()
      rejectAllPending(new Error('[gateway-ws] socket closed'))
      setState('closed')
      ws = null
      if (closedByUser || !reconnect) return
      const delay = Math.min(maxDelay, initialDelay * 2 ** attempt)
      attempt += 1
      reconnectTimer = setTimeout(() => {
        connectNow()
      }, delay)
    }
  }

  return {
    getState: () => state,

    open: () => {
      connectNow()
    },

    request,

    /** 送出自訂 Request（已由 encodeGatewayRequest 序列化之 bytes 可透過 gatewayWire 組裝） */
    sendRaw: (payload: Uint8Array) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('[gateway-ws] socket not open')
      }
      ws.send(asWsBinaryPayload(payload))
    },

    sendRequest: (fields: Parameters<typeof encodeGatewayRequest>[0]) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('[gateway-ws] socket not open')
      }
      ws.send(asWsBinaryPayload(encodeGatewayRequest(fields)))
    },

    close: () => {
      closedByUser = true
      clearHeartbeat()
      clearReconnect()
      rejectAllPending(new Error('[gateway-ws] closed by client'))
      ws?.close()
      ws = null
      setState('closed')
    },
  }
}

export type GatewayWsClient = ReturnType<typeof createGatewayWs>
