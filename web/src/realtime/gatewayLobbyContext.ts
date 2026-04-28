import { createContext, type MutableRefObject } from 'react'
import type { Game } from '../lib/api/types'
import type { GatewayWsRequestFn } from './gatewayWs'
import type { LobbyGetDecoded } from './lobbyDecode'
import type { PaymentPushWire } from './shopLobbyWire'

export type PaymentFinishListener = (push: PaymentPushWire) => void

export type GatewayLobbyContextValue = {
  requestRef: MutableRefObject<GatewayWsRequestFn | null>
  lobbyGames: Game[] | null
  lobbyLoading: boolean
  lobbyError: string | null
  liveJackpotAmounts: readonly [number, number, number] | null
  /** 最近一次成功解碼的 LOBBY_GET（與 megaman.LobbyGetResponse 對齊） */
  lobbyGet: LobbyGetDecoded | null
  subscribePaymentFinish: (listener: PaymentFinishListener) => () => void
}

export const GatewayLobbyContext = createContext<GatewayLobbyContextValue | null>(null)
