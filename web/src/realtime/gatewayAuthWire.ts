import * as protobuf from 'protobufjs/light.js'
import { ApiError } from '../lib/api/client'
import { normalizeAuthResponse } from '../lib/api/authParse'
import type { AuthResponse } from '../lib/api/types'
import schema from '../gen/gateway_auth.schema.js'

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace)

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name)
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`gateway auth wire: missing message type ${name}`)
  }
  return t
}

export function encodeLoginRequest(params: { username: string; password: string; ip?: string }): Uint8Array {
  const T = mustLookup('pinocchio.LoginRequest')
  const body = { username: params.username, password: params.password, ip: params.ip ?? '' }
  const err = T.verify(body)
  if (err) throw new Error(err)
  const msg = T.create(body)
  return Uint8Array.from(T.encode(msg).finish())
}

/**
 * 解析 `SERVER_LOGIN` 回傳的 `data`：支援 UTF-8 JSON（與 REST 相同形狀）、`ServerLoginData`、或純 `LoginResponse`（僅帳號時丟出明確錯誤，因前端仍需 Bearer token）。
 */
export function decodeServerLoginResponseData(data: Uint8Array): AuthResponse {
  if (!data.length) {
    throw new ApiError('Empty gateway login data', 500)
  }
  if (data[0] === 0x7b) {
    const text = new TextDecoder().decode(data)
    let j: unknown
    try {
      j = JSON.parse(text) as unknown
    } catch {
      throw new ApiError('Invalid JSON in login response', 500)
    }
    return normalizeAuthResponse(j)
  }
  const ServerLoginDataType = mustLookup('pinocchio.ServerLoginData')
  try {
    const msg = ServerLoginDataType.decode(data)
    const o = ServerLoginDataType.toObject(msg, { longs: String, defaults: true }) as Record<string, unknown>
    const at =
      (typeof o.accessToken === 'string' && o.accessToken) ||
      (typeof o.access_token === 'string' && o.access_token) ||
      ''
    if (at) {
      const userId = o.userId ?? o.user_id
      const displayName = o.displayName ?? o.display_name
      return normalizeAuthResponse({
        accessToken: at,
        tokenType: (o.tokenType || o.token_type) as string | undefined,
        user:
          userId != null && String(userId) !== ''
            ? {
                id: String(userId),
                displayName: typeof displayName === 'string' ? displayName : undefined,
              }
            : undefined,
      })
    }
  } catch {
    // not a valid ServerLoginData wire; try next
  }

  const LoginResponseType = mustLookup('pinocchio.LoginResponse')
  try {
    const msg = LoginResponseType.decode(data)
    const o = LoginResponseType.toObject(msg, { longs: String, defaults: true }) as {
      account?: { accountID?: string; username?: string }
    }
    const a = o.account
    if (a && ((a.accountID != null && a.accountID !== '') || a.username)) {
      throw new ApiError(
        'Gateway login returned account without access token. Use response data as JSON { accessToken, user? } or ServerLoginData with access_token, or set VITE_AUTH_USE_GATEWAY_WS=false to use REST.',
        501,
      )
    }
  } catch (e) {
    if (e instanceof ApiError) throw e
  }
  throw new ApiError('Unrecognized gateway login response format', 500)
}
