/** 對應 proto/gateway/gateway.proto ApiType（登入僅走 REST，不在此送 ApiType 4） */

export const GATEWAY_API_PING_PONG = 0
export const GATEWAY_API_LOBBY_GET = 11
/** 伺服器主動推播：SlotJackPotInfo（見 web/proto/lobby_wire.proto） */
export const GATEWAY_API_SLOT_JACKPOT_PUSH = 14
/** 切換使用中錢包 GC/SC；body 為 megaman.WalletUseRequest */
export const GATEWAY_API_WALLET_USE = 112

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
