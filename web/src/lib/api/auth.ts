import { isMockMode } from '../env'
import { apiRequest } from './client'
import { getApiPaths } from './paths'
import * as mock from './mock'
import type { AuthResponse, LoginBody, RegisterBody, User } from './types'

export async function register(body: RegisterBody): Promise<AuthResponse> {
  if (isMockMode()) return mock.mockRegister(body)
  return apiRequest<AuthResponse>(getApiPaths().register, { method: 'POST', body })
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  if (isMockMode()) return mock.mockLogin(body)
  return apiRequest<AuthResponse>(getApiPaths().login, { method: 'POST', body })
}

export async function fetchCurrentUser(token: string | null): Promise<User> {
  if (isMockMode()) return mock.mockGetMe()
  return apiRequest<User>(getApiPaths().me, { method: 'GET', token })
}
