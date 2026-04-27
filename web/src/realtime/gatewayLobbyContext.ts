import { createContext, type MutableRefObject } from 'react'
import type { Game } from '../lib/api/types'
import type { GatewayWsRequestFn } from './gatewayWs'

export type GatewayLobbyContextValue = {
  requestRef: MutableRefObject<GatewayWsRequestFn | null>
  lobbyGames: Game[] | null
  lobbyLoading: boolean
  lobbyError: string | null
  liveJackpotAmounts: readonly [number, number, number] | null
}

export const GatewayLobbyContext = createContext<GatewayLobbyContextValue | null>(null)
