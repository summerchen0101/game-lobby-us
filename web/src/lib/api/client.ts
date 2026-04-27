import { getOrCreateWebDeviceId } from '../appMeta'
import { getApiBase } from '../env'
import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  status: number
  code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 後端以業務代碼 600 要求更新客戶端（常見於 HTTP 200 的 JSON body） */
export class ClientVersionError extends Error {
  readonly updateUrl: string
  constructor(updateUrl: string) {
    super('A new version of the app is required')
    this.name = 'ClientVersionError'
    this.updateUrl = updateUrl
  }
}

type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** 為 true 時 401 不觸發全域 `unauthorizedHandler`（例如 refresh token 失敗需自行處理） */
  skipUnauthorizedOn401?: boolean
}

let unauthorizedHandler: (() => void) | null = null

let on401RefreshToken: (() => Promise<string | null>) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn
}

/** 有 access 的請求回 401 時嘗試換發 access；回傳新 token 則以新 Bearer 重試該次請求一次。 */
export function setOn401RefreshTokenHandler(fn: (() => Promise<string | null>) | null): void {
  on401RefreshToken = fn
}

function joinUrl(path: string): string {
  const base = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    // 開發時若僅用 mock，可不必設定 base
    return p
  }
  return `${base}${p}`
}

/**
 * 集中 JSON `fetch`：Bearer、`X-Device-ID`、JSON body、解錯、401 通知。
 *
 * 若 HTTP 2xx 且回應 body 為空字串，不會解析 JSON，回傳值為 `null`（泛型 `T` 實際可能為 `null`）。
 * 後端可以此表示成功但無 payload（例如 `201` 無內容）；呼叫端依端點語意處理，勿一律當格式錯誤。
 */
export async function apiRequest<T>(
  path: string,
  init: JsonRequestInit & { token?: string | null } = {},
  /** 內部用：已嘗試過 refresh 時勿再遞迴 */
  _didRefresh?: boolean,
): Promise<T> {
  const { token, body, headers, skipUnauthorizedOn401, ...rest } = init
  const url = joinUrl(path)

  const h = new Headers(headers)
  h.set('Accept', 'application/json')
  h.set('X-Device-ID', getOrCreateWebDeviceId())
  if (body !== undefined) {
    h.set('Content-Type', 'application/json')
  }
  if (token) {
    h.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...rest,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    if (token && on401RefreshToken && !_didRefresh) {
      const newAccess = await on401RefreshToken()
      if (newAccess) {
        return apiRequest<T>(
          path,
          { ...init, token: newAccess, skipUnauthorizedOn401 },
          true,
        )
      }
    }
    if (!skipUnauthorizedOn401) {
      unauthorizedHandler?.()
    }
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      if (!res.ok) {
        throw new ApiError(text.slice(0, 200), res.status)
      }
    }
  }

  if (!res.ok) {
    const err = data as ApiErrorBody | null
    const msg = err?.message ?? res.statusText ?? 'Request failed'
    throw new ApiError(msg, res.status, err?.code)
  }

  return data as T
}
