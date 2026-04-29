import { hexPreview } from './bytesHexPreview'
import {
  GATEWAY_API_BUY_PRODUCT,
  GATEWAY_API_CREATE_WITHDRAW_ORDER,
  GATEWAY_API_LIST_PRODUCTS,
  GATEWAY_API_LIST_WITHDRAW_ORDERS,
  GATEWAY_API_LOBBY_GET,
  GATEWAY_API_MEGA_ACCOUNT_BINDING,
  GATEWAY_API_PING_PONG,
  GATEWAY_API_SERVER_LOGIN,
  GATEWAY_API_WALLET_USE,
} from './gatewayApi'
import {
  decodeBuyProductRequestForDevLog,
  decodeListProductsRequestForDevLog,
  decodeMegaAccountBindingRequestForDevLog,
} from './shopLobbyWire'
import {
  decodeCreateWithdrawOrderRequestForDevLog,
  decodeListWithdrawOrdersRequestForDevLog,
} from './withdrawLobbyWire'
import { tryDecodeWalletUseRequestForDev } from './walletLobbyWire'

const HEX_MAX = 48

/** 與後端 inner `data` bytes 解碼後一致之欄位；解碼失敗或非預期時附 `hexPreview` / `decodeError`。 */
export type GatewayRequestDataDecoded = Record<string, unknown>

function fallbackHex(raw: Uint8Array, err: unknown): GatewayRequestDataDecoded {
  const message = err instanceof Error ? err.message : String(err)
  return {
    decodeError: message,
    hexPreview: hexPreview(raw, HEX_MAX),
  }
}

/**
 * 將送出之 `gateway.Request.data`（inner protobuf）解成與送後端相同語意之 plain object（專供 dev log）。
 * 不拋出例外。
 */
export function decodeGatewayRequestDataForDevLog(
  apiType: number,
  raw: Uint8Array,
): GatewayRequestDataDecoded {
  const empty = raw.byteLength === 0

  if (apiType === GATEWAY_API_PING_PONG) {
    if (empty) return {}
    return {
      unexpectedBytes: raw.byteLength,
      hexPreview: hexPreview(raw, HEX_MAX),
    }
  }
  if (apiType === GATEWAY_API_SERVER_LOGIN) {
    if (empty) return {}
    return {
      unexpectedBytes: raw.byteLength,
      hexPreview: hexPreview(raw, HEX_MAX),
    }
  }
  if (apiType === GATEWAY_API_LOBBY_GET) {
    if (empty) return {}
    return {
      unexpectedBytes: raw.byteLength,
      hexPreview: hexPreview(raw, HEX_MAX),
    }
  }

  if (apiType === GATEWAY_API_LIST_PRODUCTS) {
    if (empty) {
      return {}
    }
    try {
      return decodeListProductsRequestForDevLog(raw)
    } catch (e) {
      return fallbackHex(raw, e)
    }
  }

  if (apiType === GATEWAY_API_BUY_PRODUCT) {
    try {
      return decodeBuyProductRequestForDevLog(raw)
    } catch (e) {
      return fallbackHex(raw, e)
    }
  }

  if (apiType === GATEWAY_API_MEGA_ACCOUNT_BINDING) {
    try {
      return decodeMegaAccountBindingRequestForDevLog(raw)
    } catch (e) {
      return fallbackHex(raw, e)
    }
  }

  if (apiType === GATEWAY_API_WALLET_USE) {
    if (empty) {
      return {}
    }
    const w = tryDecodeWalletUseRequestForDev(raw)
    if (w) {
      return w
    }
    return {
      decodeError: 'body not decodable as WalletUseRequest',
      hexPreview: hexPreview(raw, HEX_MAX),
    }
  }

  if (apiType === GATEWAY_API_LIST_WITHDRAW_ORDERS) {
    try {
      return decodeListWithdrawOrdersRequestForDevLog(raw)
    } catch (e) {
      return fallbackHex(raw, e)
    }
  }

  if (apiType === GATEWAY_API_CREATE_WITHDRAW_ORDER) {
    try {
      return decodeCreateWithdrawOrderRequestForDevLog(raw)
    } catch (e) {
      return fallbackHex(raw, e)
    }
  }

  if (empty) {
    return { apiType }
  }

  return {
    apiType,
    hexPreview: hexPreview(raw, HEX_MAX),
  }
}
