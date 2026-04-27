/** 對應 proto/gateway/gateway.proto ApiType */

export const GATEWAY_API_PING_PONG = 0
/** 帳密登入；`data` 通常為 `pinocchio.LoginRequest` 序列化，回 `data` 可為 JSON 或 proto（見 `gatewayAuthWire`） */
export const GATEWAY_API_SERVER_LOGIN = 4
export const GATEWAY_API_LOBBY_GET = 11
