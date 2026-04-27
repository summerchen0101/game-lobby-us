/** 對應 proto/gateway/gateway.proto ApiType（登入僅走 REST，不在此送 ApiType 4） */

export const GATEWAY_API_PING_PONG = 0
export const GATEWAY_API_LOBBY_GET = 11
/** 伺服器主動推播：SlotJackPotInfo（見 web/proto/lobby_wire.proto） */
export const GATEWAY_API_SLOT_JACKPOT_PUSH = 14
/** 切換使用中錢包 GC/SC；body 為 megaman.WalletUseRequest */
export const GATEWAY_API_WALLET_USE = 112
