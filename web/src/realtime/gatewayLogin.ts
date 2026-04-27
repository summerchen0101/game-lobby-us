import { ApiError } from '../lib/api/client'
import type { AuthResponse, User } from '../lib/api/types'
import { gatewayLoginRequestTimeoutMs, getGatewayWsUrl } from '../lib/env'
import { decodeServerLoginResponseData, encodeLoginRequest } from './gatewayAuthWire'
import { GATEWAY_API_SERVER_LOGIN } from './gatewayApi'
import { createGatewayWs } from './gatewayWs'
import { isGatewaySuccessCode } from './gatewayWire'

/**
 * 整段登入流程（連線＋`request()`）外層逾時，需大於單次 `request()` 逾時。
 * @param requestMs 見 `gatewayLoginRequestTimeoutMs()`。
 */
function overallLoginTimeoutMs(requestMs: number): number {
  return Math.max(requestMs + 15_000, 30_000)
}

function opaqueWs204Token(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `ws204-${crypto.randomUUID()}`
  }
  return `ws204-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** 後端 `204` 且無 `data` 時無 JWT；給 `user` 讓 AuthProvider 略過 REST `/me`。 */
function authResponseForEmptySuccess(account: string): AuthResponse {
  const trimmed = account.trim()
  const user: User = { id: trimmed, displayName: trimmed }
  return {
    accessToken: opaqueWs204Token(),
    tokenType: 'Bearer',
    user,
  }
}

/**
 * 建立臨時 Gateway 連線，送 `ApiType` `SERVER_LOGIN`（4）與 `LoginRequest`（username=帳號、password），解析回 `AuthResponse`。
 * 關閉前即中斷連線；成功後大廳仍另建長連線（見 `useGatewayWs`）。
 */
export function loginWithGatewayWebSocket(account: string, password: string): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const requestTimeoutMs = gatewayLoginRequestTimeoutMs()
    const overallLimitMs = overallLoginTimeoutMs(requestTimeoutMs)
    const clientVer = (import.meta.env.VITE_CLIENT_VER ?? '').trim() || 'web-alpha'
    let settled = false
    let success = false
    const overallTimer: { id?: ReturnType<typeof setTimeout> } = {}

    const client = createGatewayWs({
      wsToken: '',
      clientVer,
      url: getGatewayWsUrl({ token: '' }),
      reconnect: false,
      heartbeatIntervalMs: 0,
      /** 不送首包 PING，只保留一筆 `SERVER_LOGIN` 的 `pending` */
      skipInitialPing: true,
      /** 後端回寫的 requestID 常與請求不同，僅一筆 pending 時以成功回應配對 */
      pairUnmatchedSuccessToSinglePending: true,
      requestTimeoutMs,
      onState: (s) => {
        if (s === 'closed' && !settled) {
          settled = true
          if (overallTimer.id) clearTimeout(overallTimer.id)
          if (!success) {
            reject(new Error('[gateway-ws] connection closed before login completed'))
          }
        }
      },
      onOpen: ({ request }) => {
        void (async () => {
          try {
            const data = encodeLoginRequest({ username: account.trim(), password, ip: '' })
            const res = await request({
              type: GATEWAY_API_SERVER_LOGIN,
              data,
              debugLabel: 'SERVER_LOGIN',
            })
            const code = String(res.code ?? '')
            if (!isGatewaySuccessCode(code)) {
              throw new ApiError(
                typeof res.errMessage === 'string' && res.errMessage
                  ? res.errMessage
                  : 'Gateway login failed',
                Number.isFinite(Number.parseInt(code, 10)) ? Number.parseInt(code, 10) : 400,
              )
            }
            const raw = res.data
            if (!(raw instanceof Uint8Array) || raw.length === 0) {
              if (code === '204') {
                const auth = authResponseForEmptySuccess(account)
                success = true
                settled = true
                if (overallTimer.id) clearTimeout(overallTimer.id)
                client.close()
                resolve(auth)
                return
              }
              throw new ApiError('Login succeeded but response data is empty', 500)
            }
            const auth = decodeServerLoginResponseData(raw)
            success = true
            settled = true
            if (overallTimer.id) clearTimeout(overallTimer.id)
            client.close()
            resolve(auth)
          } catch (e) {
            if (!settled) {
              settled = true
              if (overallTimer.id) clearTimeout(overallTimer.id)
              client.close()
              reject(
                e instanceof Error ? e : new Error(String(e)),
              )
            }
          }
        })()
      },
      onSocketError: () => {
        if (!settled) {
          settled = true
          if (overallTimer.id) clearTimeout(overallTimer.id)
          client?.close()
          reject(new Error('Gateway WebSocket error'))
        }
      },
    })
    overallTimer.id = setTimeout(() => {
      if (!settled) {
        settled = true
        client.close()
        reject(new ApiError('Gateway login timeout', 408))
      }
    }, overallLimitMs)
    client.open()
  })
}
