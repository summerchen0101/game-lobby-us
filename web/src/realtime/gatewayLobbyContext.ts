import { createContext, type MutableRefObject } from 'react'
import type { Game } from '../lib/api/types'
import type { GatewayWsRequestFn } from './gatewayWs'
import type { LobbyGetDecoded } from './lobbyDecode'
import type { PaymentPushWire } from './shopLobbyWire'
import type { WithdrawSuccessPushWire } from './withdrawLobbyWire'

export type PaymentFinishListener = (push: PaymentPushWire) => void

export type WithdrawSuccessPushListener = (push: WithdrawSuccessPushWire) => void

export type GatewayLobbyContextValue = {
  requestRef: MutableRefObject<GatewayWsRequestFn | null>
  /** Gateway WS `onOpen` 已設定且可使用 `request()`（mock 模式或非 WS 環境為 false） */
  gatewayRequestReady: boolean
  lobbyGames: Game[] | null
  lobbyLoading: boolean
  lobbyError: string | null
  liveJackpotAmounts: readonly [number, number, number] | null
  /** 最近一次成功解碼的 LOBBY_GET（與 megaman.LobbyGetResponse 對齊） */
  lobbyGet: LobbyGetDecoded | null
  subscribePaymentFinish: (listener: PaymentFinishListener) => () => void
  subscribeWithdrawSuccessPush: (listener: WithdrawSuccessPushListener) => () => void
}

export const GatewayLobbyContext = createContext<GatewayLobbyContextValue | null>(null)
