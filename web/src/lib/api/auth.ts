import { isAuthUseGatewayWs, isMockMode } from '../env'
import { apiRequest } from './client'
import { normalizeAuthResponse, normalizeUserPayload } from './authParse'
import { getApiPaths } from './paths'
import * as mock from './mock'
import { loginWithGatewayWebSocket } from '../../realtime/gatewayLogin'
import type { AuthResponse, LoginBody, RegisterBody, User } from './types'

export async function register(body: RegisterBody): Promise<AuthResponse> {
  if (isMockMode()) return mock.mockRegister(body)
  const data = await apiRequest<unknown>(getApiPaths().register, { method: 'POST', body })
  return normalizeAuthResponse(data)
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  if (isMockMode()) return mock.mockLogin(body)
  if (isAuthUseGatewayWs()) {
    return loginWithGatewayWebSocket(body.account, body.password)
  }
  const data = await apiRequest<unknown>(getApiPaths().login, { method: 'POST', body })
  return normalizeAuthResponse(data)
}

export async function fetchCurrentUser(token: string | null): Promise<User> {
  if (isMockMode()) return mock.mockGetMe()
  const data = await apiRequest<unknown>(getApiPaths().me, { method: 'GET', token })
  return normalizeUserPayload(data)
}
