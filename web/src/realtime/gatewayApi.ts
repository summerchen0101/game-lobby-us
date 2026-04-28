/**
 * 對應 proto/gateway/gateway.proto ApiType。
 * HTTP `/api/v1/login` 為身分驗證；WebSocket 連線後另送 `ServerLogin`(4) 完成 Gateway 會話。
 */

export const GATEWAY_API_PING_PONG = 0
/** 連線後伺服器登入；對應 ApiType ServerLogin / SERVER_LOGIN；`data` 為空 */
export const GATEWAY_API_SERVER_LOGIN = 4
export const GATEWAY_API_LOBBY_GET = 11
/** 伺服器主動推播：與 proto/gateway/gateway.proto ApiType SLOT_JACKPOT_INFO_PUSH(14) 一致；body 為 megaman.SlotJackPotInfo（見 web/proto/lobby_wire.proto） */
export const GATEWAY_API_SLOT_JACKPOT_PUSH = 14
/** 切換使用中錢包 GC/SC；body 為 megaman.WalletUseRequest */
export const GATEWAY_API_WALLET_USE = 112

/** 玩家頭像列表；body 空；回應 megaman.ListPlayerAvatarsResponse */
export const GATEWAY_API_LIST_PLAYER_AVATARS = 22
/** 更新玩家頭像；body 為 megaman.UpdatePlayerCurrentAvatarRequest */
export const GATEWAY_API_UPDATE_PLAYER_AVATAR = 23
/** 取得第三方遊戲連結；body 為 megaman.GetThirdPartyGameInfoRequest */
export const GATEWAY_API_GET_THIRD_PARTY_GAME_INFO = 701

/** 商城商品列表；body 為 megaman.ListProductsRequest */
export const GATEWAY_API_LIST_PRODUCTS = 316
/** 建立購買訂單；body 為 megaman.BuyProductRequest */
export const GATEWAY_API_BUY_PRODUCT = 317
/** 帳號／手機綁定；body 為 megaman.MegaAccountBindingRequest */
export const GATEWAY_API_MEGA_ACCOUNT_BINDING = 362

/** 伺服器推播外層：內層 MsgResp（見 megaman.MsgResp） */
export const GATEWAY_API_SEND_MESSAGE_PUSH = 1000
/** MsgResp.msg.apiType：付款完成（內層 data 為 megaman.PaymentPush） */
export const GATEWAY_API_PAYMENT_FINISH_PUSH = 1013
