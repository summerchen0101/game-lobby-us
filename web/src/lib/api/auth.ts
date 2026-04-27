import { isMockMode } from '../env'
import { buildAppMetaPayload, LOGIN_V1_TYPE } from '../appMeta'
import { apiRequest, ApiError } from './client'

export { ClientVersionError } from './client'
import {
  normalizeAuthResponse,
  normalizeUserPayload,
  parseSignupResponse,
} from './authParse'
import { getApiPaths } from './paths'
import * as mock from './mock'
import type { AuthResponse, LoginBody, SignupResult, SignUpRequest, User } from './types'

function buildV1LoginBody(body: LoginBody) {
  return {
    email: body.account.trim(),
    password: body.password,
    type: LOGIN_V1_TYPE,
    app_meta: buildAppMetaPayload(),
  }
}

export async function signUp(body: SignUpRequest): Promise<SignupResult> {
  if (isMockMode()) {
    if (body.answer) {
      return { needSMSAnswer: false, auth: await mock.mockRegisterFromSignUp(body) }
    }
    return { needSMSAnswer: true }
  }
  const data = await apiRequest<unknown>(getApiPaths().register, { method: 'POST', body })
  return parseSignupResponse(data, body)
}

/** 第二階註冊（已填 `answer`）或後端不須驗證而直接回 token 時，取回 `AuthResponse`。 */
export async function completeSignUp(body: SignUpRequest): Promise<AuthResponse> {
  const s = await signUp(body)
  if (s.auth) return s.auth
  if (s.needSMSAnswer) {
    throw new ApiError('Sign-up incomplete: enter the verification code or try again', 400)
  }
  if (body.answer?.trim()) {
    return login({ account: body.email, password: body.password })
  }
  throw new ApiError('Sign-up incomplete: enter the verification code or try again', 400)
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  if (isMockMode()) {
    return mock.mockRefreshToken(refreshToken)
  }
  const data = await apiRequest<unknown>(getApiPaths().token, {
    method: 'POST',
    body: { refreshToken },
    skipUnauthorizedOn401: true,
  })
  return normalizeAuthResponse(data)
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  if (isMockMode()) return mock.mockLogin(body)
  const data = await apiRequest<unknown>(getApiPaths().login, {
    method: 'POST',
    body: buildV1LoginBody(body),
  })
  return normalizeAuthResponse(data)
}

export async function fetchCurrentUser(token: string | null): Promise<User> {
  if (isMockMode()) return mock.mockGetMe()
  const data = await apiRequest<unknown>(getApiPaths().me, { method: 'GET', token })
  return normalizeUserPayload(data)
}
