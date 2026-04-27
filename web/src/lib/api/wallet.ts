import { isMockMode } from '../env'
import { apiRequest } from './client'
import { getApiPaths } from './paths'
import * as mock from './mock'
import type { DepositParams, DepositResponse } from './types'

export async function fetchDepositUrl(
  token: string | null,
  returnUrl: string,
  params?: DepositParams,
): Promise<DepositResponse> {
  if (isMockMode()) return mock.mockDeposit(returnUrl)
  const p = new URLSearchParams()
  p.set('returnUrl', returnUrl)
  if (params?.channel) p.set('channel', params.channel)
  if (params?.amount) p.set('amount', params.amount)
  const path = `${getApiPaths().deposit}?${p.toString()}`
  return apiRequest<DepositResponse>(path, { method: 'GET', token })
}
