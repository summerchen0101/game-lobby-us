import {
  decodeGatewayResponse,
  encodeGatewayRequest,
  gatewayResponseToObject,
  isGatewaySuccessCode,
} from './gatewayWire'
import { getGatewayWsUrl } from '../lib/env'

export type GatewayWsConnectionState = 'idle' | 'connecting' | 'open' | 'closed'

export type GatewayWsResponseObject = ReturnType<typeof gatewayResponseToObject>

export type GatewayWsOptions = {
  /** 若設定則完全覆寫連線 URL（含 query）；除錯用 */
  url?: string
  /**
   * 併入連線 URL 的 query `token`（試玩可空字串）。
   * 未設定時沿用 `getGatewayWsUrl()` 規則（可保留 `VITE_WS_URL` 內既有 token）。
   */
  wsToken?: string | null
  /** 預設 25s；<=0 則不送 PING_PONG */
  heartbeatIntervalMs?: number
  /** 斷線後自動重連；預設 true */
  reconnect?: boolean
  initialReconnectDelayMs?: number
  maxReconnectDelayMs?: number
  /** 併入每則 Request 的 RequestBasic（如 token、userID） */
  getRequestBasicExtras?: () => Record<string, unknown>
  onState?: (s: GatewayWsConnectionState) => void
  onResponse?: (msg: GatewayWsResponseObject) => void
  /** WebSocket 層錯誤 */
  onSocketError?: (ev: Event) => void
  /** 業務 code 非 200/204 時觸發（仍會先呼叫 onResponse） */
  onGatewayError?: (msg: GatewayWsResponseObject) => void
}

const PING_PONG = 0

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

  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? 25_000
  const reconnect = options.reconnect !== false
  const initialDelay = options.initialReconnectDelayMs ?? 1_000
  const maxDelay = options.maxReconnectDelayMs ?? 30_000

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
    return encodeGatewayRequest({
      basic: {
        ...extras,
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
      ws?.close()
      ws = null
      setState('closed')
    },
  }
}

export type GatewayWsClient = ReturnType<typeof createGatewayWs>
