import { ApiError, ClientVersionError } from './client'
import type { AuthResponse, SignupResult, SignUpRequest, User } from './types'

function strField(o: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const a = o[camel]
  const b = o[snake]
  if (typeof a === 'string' && a) return a
  if (typeof b === 'string' && b) return b
  return undefined
}

function numField(o: Record<string, unknown>, camel: string, snake: string): number | undefined {
  for (const k of [camel, snake]) {
    const v = o[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return undefined
}

export function normalizeUserPayload(raw: unknown): User {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Invalid user payload', 500)
  }
  const o = raw as Record<string, unknown>
  const idRaw = o.id ?? o.user_id
  if (idRaw == null || idRaw === '') {
    throw new ApiError('Invalid user payload', 500)
  }
  const id = String(idRaw)
  const u: User = { id }
  const dn = strField(o, 'displayName', 'display_name')
  if (dn !== undefined) u.displayName = dn
  const b = numField(o, 'balance', 'balance')
  if (b !== undefined) u.balance = b
  const cur = strField(o, 'currency', 'currency')
  if (cur !== undefined) u.currency = cur
  const sc = numField(o, 'sweepstakesBalance', 'sweepstakes_balance')
  if (sc !== undefined) u.sweepstakesBalance = sc
  const vl = numField(o, 'vipLevel', 'vip_level')
  if (vl !== undefined) u.vipLevel = Math.floor(vl)
  return u
}

function optStr(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v) return v
  }
  return undefined
}

export function throwIfClientVersionError(raw: unknown): void {
  if (!raw || typeof raw !== 'object') return
  const o = raw as Record<string, unknown>
  const code = o.Code ?? o.code
  if (code === 600 || code === '600') {
    const u = o.Update ?? o.update ?? o.updateUrl ?? o.url
    const update = typeof u === 'string' && u ? u : optStr(o, 'updateUrl', 'url')
    if (update) throw new ClientVersionError(update)
  }
}

export function normalizeAuthResponse(raw: unknown): AuthResponse {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Invalid auth response', 500)
  }
  const o = raw as Record<string, unknown>
  throwIfClientVersionError(o)
  const accessToken = strField(o, 'accessToken', 'access_token') ?? ''
  if (!accessToken) {
    throw new ApiError('Missing accessToken', 500)
  }
  const tokenType = strField(o, 'tokenType', 'token_type')
  const aRefreshToken = optStr(o, 'aRefreshToken', 'a_refresh_token', 'refreshToken', 'refresh_token')
  const expRaw = o.expiresIn ?? o.expires_in
  let expiresIn: number | undefined
  if (typeof expRaw === 'number' && !Number.isNaN(expRaw)) {
    expiresIn = expRaw
  } else if (typeof expRaw === 'string' && expRaw !== '') {
    const n = Number(expRaw)
    if (!Number.isNaN(n)) expiresIn = n
  }
  let user: User | undefined
  if (o.user != null && typeof o.user === 'object') {
    try {
      user = normalizeUserPayload(o.user)
    } catch {
      user = undefined
    }
  }
  return { accessToken, tokenType, user, aRefreshToken, expiresIn }
}

export function parseSignupResponse(raw: unknown, request: SignUpRequest): SignupResult {
  const completingOtp = !!request.answer?.trim()
  if (!raw || typeof raw !== 'object') {
    if (completingOtp) {
      return { needSMSAnswer: false }
    }
    throw new ApiError('Invalid signup response', 500)
  }
  throwIfClientVersionError(raw)
  const o = raw as Record<string, unknown>
  const needRaw = o.needSMSAnswer ?? o.need_sms_answer
  const need =
    needRaw === true || needRaw === 1 || String(needRaw).toLowerCase() === 'true'
  if (need) {
    return { needSMSAnswer: true }
  }
  const hasToken = !!(strField(o, 'accessToken', 'access_token') ?? '')
  if (hasToken) {
    return { needSMSAnswer: false, auth: normalizeAuthResponse(o) }
  }
  return { needSMSAnswer: false }
}
