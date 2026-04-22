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

type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn
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
 * 集中 JSON `fetch`：Bearer、JSON body、解錯、401 通知。
 */
export async function apiRequest<T>(
  path: string,
  init: JsonRequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, body, headers, ...rest } = init
  const url = joinUrl(path)

  const h = new Headers(headers)
  h.set('Accept', 'application/json')
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
    unauthorizedHandler?.()
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
