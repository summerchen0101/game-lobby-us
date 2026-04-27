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
  /**
   * 僅 `import.meta.env.DEV`：console 上辨識用途（如 `SERVER_LOGIN`、`LOBBY_GET`），不寫上線。
   */
  debugLabel?: string
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
  /**
   * 若為 true，`open` 時不送首包 `PING_PONG`（仍遵守 `heartbeatIntervalMs` 之後續心跳）。
   * 用於臨時連線只發單一業務請求、避免兩筆 `pending` 與後端亂序回包。
   */
  skipInitialPing?: boolean
  /**
   * 若為 true：當回應之 `basic.requestID` 與任一 `pending` 不符，但 `code` 為成功且僅剩一筆 `pending` 時，
   * 仍將該則回應配給那筆請求（因部分後端不會回寫與 Request 相同之 requestID）。
   */
  pairUnmatchedSuccessToSinglePending?: boolean
}

const PING_PONG = 0

type PendingEntry = {
  resolve: (v: GatewayWsResponseObject) => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout> | null
  /** 僅 DEV；與 `GatewayWsRequestPayload.debugLabel` 相同 */
  debugLabel?: string
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

/** 與 `pending` 的 key（UUID 字串）比對用；避免 Long／number 邊角 */
function normalizeResponseRequestId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (typeof raw === 'bigint') return raw.toString()
  return String(raw).trim()
}

/** `toObject`／執行期可能為 `requestID` 或 `requestId`，需與送出之 `RequestBasic.requestID` 對齊 */
function extractBasicRequestId(basic: unknown): string {
  if (!basic || typeof basic !== 'object') return ''
  const o = basic as Record<string, unknown>
  return normalizeResponseRequestId(o.requestID ?? o.requestId)
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
  const skipInitialPing = options.skipInitialPing === true
  const pairUnmatchedSuccessToSinglePending = options.pairUnmatchedSuccessToSinglePending === true

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

  function buildPingRequest(): { payload: Uint8Array; requestID: string } {
    const extras = options.getRequestBasicExtras?.() ?? {}
    const tokenBasic =
      options.wsToken !== undefined
        ? (options.wsToken ?? '')
        : String((extras as { token?: string }).token ?? '')
    const requestID = randomRequestId()
    const payload = encodeGatewayRequest({
      basic: {
        ...extras,
        clientVer: (extras as { clientVer?: string }).clientVer ?? defaultClientVer,
        token: tokenBasic,
        timestamp: Date.now(),
        requestID,
      },
      type: PING_PONG,
      data: new Uint8Array(0),
    })
    return { payload, requestID }
  }

  function sendPing() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try {
      const { payload, requestID } = buildPingRequest()
      if (import.meta.env.DEV) {
        console.info('[gateway-ws][dev] PING_PONG', '→ request', {
          type: PING_PONG,
          requestID,
          dataLength: 0,
        })
      }
      ws.send(asWsBinaryPayload(payload))
    } catch (e) {
      console.warn('[gateway-ws] ping send failed', e)
    }
  }

  function startHeartbeat() {
    clearHeartbeat()
    if (heartbeatIntervalMs <= 0) return
    heartbeatTimer = setInterval(sendPing, heartbeatIntervalMs)
  }

  function handleIncomingArrayBuffer(data: ArrayBuffer) {
    let obj: GatewayWsResponseObject
    try {
      const buf = new Uint8Array(data)
      const decoded = decodeGatewayResponse(buf)
      obj = gatewayResponseToObject(decoded)
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[gateway-ws] failed to decode binary as gateway.Response', e)
      }
      return
    }
    const rid = extractBasicRequestId((obj as { basic?: unknown }).basic)
    const codeStr = String(obj.code ?? '')
    const success = isGatewaySuccessCode(codeStr)

    function completeEntry(requestKey: string, entry: PendingEntry) {
      if (import.meta.env.DEV && entry.debugLabel) {
        const d = (obj as { data?: Uint8Array }).data
        console.info('[gateway-ws][dev]', entry.debugLabel, '← response', {
          type: obj.type,
          code: codeStr,
          responseRequestId: extractBasicRequestId((obj as { basic?: unknown }).basic) || '(empty)',
          dataLength: d instanceof Uint8Array ? d.byteLength : 0,
        })
      }
      pending.delete(requestKey)
      if (entry.timer !== null) {
        clearTimeout(entry.timer)
        entry.timer = null
      }
      entry.resolve(obj)
    }

    if (rid && pending.has(rid)) {
      const entry = pending.get(rid)!
      completeEntry(rid, entry)
    } else if (
      pairUnmatchedSuccessToSinglePending &&
      success &&
      pending.size === 1
    ) {
      const [onlyId, entry] = pending.entries().next().value!
      completeEntry(onlyId, entry)
    } else if (import.meta.env.DEV && pending.size > 0) {
      const pendingSample = pending.size <= 3 ? [...pending.keys()].join(', ') : `${pending.size} keys`
      console.warn('[gateway-ws] response did not match any pending request', {
        responseRequestId: rid || '(empty)',
        pendingKeysSample: pendingSample,
        type: obj.type,
        code: codeStr,
        errMessage: (obj as { errMessage?: string }).errMessage,
      })
    }
    if (import.meta.env.DEV && success && Number(obj.type) === 0) {
      const d0 = (obj as { data?: Uint8Array }).data
      console.info('[gateway-ws][dev] PING_PONG', '← response', {
        type: 0,
        code: codeStr,
        responseRequestId: rid || '(empty)',
        dataLength: d0 instanceof Uint8Array ? d0.byteLength : 0,
      })
    }
    options.onResponse?.(obj)
    if (codeStr && !isGatewaySuccessCode(codeStr)) {
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
          const ent = pending.get(requestID)
          if (import.meta.env.DEV && ent?.debugLabel) {
            console.warn('[gateway-ws][dev] timeout', {
              debugLabel: ent.debugLabel,
              requestID,
            })
          }
          pending.delete(requestID)
          reject(new Error(`[gateway-ws] request timeout: ${requestID}`))
        }, requestTimeoutMs)
      }
      const dataForLen = req.data ?? new Uint8Array(0)
      pending.set(requestID, {
        resolve,
        reject,
        timer,
        debugLabel: req.debugLabel,
      })
      try {
        ws!.send(asWsBinaryPayload(payload))
        if (import.meta.env.DEV && req.debugLabel) {
          console.info('[gateway-ws][dev]', req.debugLabel, '→ request', {
            type: req.type,
            requestID,
            dataLength: dataForLen.byteLength,
          })
        }
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
      if (!skipInitialPing) {
        sendPing()
      }
      startHeartbeat()
      options.onOpen?.({ request })
    }

    socket.onmessage = (ev) => {
      const d = ev.data
      if (d instanceof ArrayBuffer) {
        handleIncomingArrayBuffer(d)
        return
      }
      if (typeof Blob !== 'undefined' && d instanceof Blob) {
        void d.arrayBuffer().then(
          (ab) => {
            handleIncomingArrayBuffer(ab)
          },
          (e) => {
            if (import.meta.env.DEV) {
              console.warn('[gateway-ws] Blob.arrayBuffer() failed', e)
            }
          },
        )
        return
      }
      if (typeof d === 'string') {
        if (import.meta.env.DEV) {
          console.warn(
            '[gateway-ws] text WebSocket frame (ignored; expected binary gateway.Response)',
            d.length > 200 ? `${d.slice(0, 200)}…` : d,
          )
        }
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
