import { isMockMode } from '../env'
import { apiRequest } from './client'
import { getApiPaths } from './paths'
import * as mock from './mock'
import type { GamesResponse } from './types'

export async function fetchGames(token: string | null): Promise<GamesResponse> {
  if (isMockMode()) return mock.mockGetGames()
  return apiRequest<GamesResponse>(getApiPaths().games, { method: 'GET', token })
}
