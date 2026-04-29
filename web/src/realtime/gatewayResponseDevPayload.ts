import {
  GATEWAY_API_BUY_PRODUCT,
  GATEWAY_API_CREATE_WITHDRAW_ORDER,
  GATEWAY_API_GET_THIRD_PARTY_GAME_INFO,
  GATEWAY_API_GET_JACKPOT_INFO,
  GATEWAY_API_JACKPOT_INFO_PUSH,
  GATEWAY_API_LIST_PLAYER_AVATARS,
  GATEWAY_API_LIST_PRODUCTS,
  GATEWAY_API_LIST_WITHDRAW_ORDERS,
  GATEWAY_API_LOBBY_GET,
  GATEWAY_API_MEGA_ACCOUNT_BINDING,
  GATEWAY_API_PING_PONG,
  GATEWAY_API_SEND_MESSAGE_PUSH,
  GATEWAY_API_SERVER_LOGIN,
  GATEWAY_API_SLOT_JACKPOT_PUSH,
  GATEWAY_API_UPDATE_PLAYER_AVATAR,
  GATEWAY_API_WALLET_USE,
  GATEWAY_API_WITHDRAW_SUCCESS_PUSH,
} from "./gatewayApi";
import type { GatewayWsResponseObject } from "./gatewayWs";
import { hexPreview } from "./bytesHexPreview";
import {
  decodeSlotJackPotInfoToObjectForDev,
  decodeListJackPotRespToObjectForDev,
} from "./jackpotLobbyWire";
import { decodeLobbyGetResponseBytes } from "./lobbyDecode";
import {
  decodeBuyProductResponseBytes,
  decodeListProductsResponseBytes,
  decodeMegaAccountBindingResponseBytes,
  tryDecodeSendMessagePushToPaymentPush,
} from "./shopLobbyWire";
import { tryDecodeWalletUseRequestForDev } from "./walletLobbyWire";
import {
  decodeGetThirdPartyGameInfoResponseBytes,
  decodeListPlayerAvatarsResponseBytes,
} from "./playerAvatarWire";
import {
  decodeCreateWithdrawOrderResponseBytes,
  decodeListWithdrawOrdersResponseBytes,
  decodeWithdrawSuccessPushBytes,
} from "./withdrawLobbyWire";

const HEX_MAX = 48;

type DataDecodedResult =
  | { kind: string; [key: string]: unknown }
  | { decodeError: string; hexPreview: string; kind: "fallback" };

function fallbackHex(raw: Uint8Array, err: unknown): DataDecodedResult {
  const message = err instanceof Error ? err.message : String(err);
  return {
    kind: "fallback",
    decodeError: message,
    hexPreview: hexPreview(raw, HEX_MAX),
  };
}

/**
 * 將 `gateway.Response` 的 `data` 依 `type` 轉成可讀摘要（專供 dev log）。
 * 不拋出例外。
 */
export function decodeGatewayResponseDataForDevLog(
  type: number,
  code: string,
  raw: Uint8Array,
): DataDecodedResult {
  const empty = raw.byteLength === 0;
  if (type === GATEWAY_API_PING_PONG) {
    if (empty) {
      return { kind: "PING_PONG", note: "empty" };
    }
    return { kind: "PING_PONG", unexpectedBytes: raw.byteLength };
  }
  if (type === GATEWAY_API_SERVER_LOGIN) {
    if (empty) {
      return { kind: "SERVER_LOGIN", note: "empty" };
    }
    return {
      kind: "SERVER_LOGIN",
      unexpectedBytes: raw.byteLength,
      hexPreview: hexPreview(raw, HEX_MAX),
    };
  }
  if (code === "204" && empty) {
    return { kind: "noBody", code: "204" };
  }
  if (empty) {
    return { kind: "empty", type };
  }

  try {
    if (type === GATEWAY_API_LOBBY_GET) {
      const decoded = decodeLobbyGetResponseBytes(raw);
      return {
        kind: "LOBBY_GET",
        data: decoded,
      };
    }
    if (
      type === GATEWAY_API_SLOT_JACKPOT_PUSH ||
      type === GATEWAY_API_JACKPOT_INFO_PUSH ||
      type === GATEWAY_API_GET_JACKPOT_INFO
    ) {
      if (type === GATEWAY_API_GET_JACKPOT_INFO) {
        const list = decodeListJackPotRespToObjectForDev(raw);
        if (list && list.infoCount > 0) {
          return {
            kind: "LIST_JACKPOT",
            list,
          };
        }
        return fallbackHex(
          raw,
          new Error("ListJackPotResp decode empty or failed"),
        );
      }
      const slot = decodeSlotJackPotInfoToObjectForDev(raw);
      if (slot && slot.jackpotAmounts.length > 0) {
        return { kind: "SLOT_JACKPOT", slot };
      }
      const list = decodeListJackPotRespToObjectForDev(raw);
      if (list && list.infoCount > 0) {
        return {
          kind: "LIST_JACKPOT",
          list,
        };
      }
      return fallbackHex(raw, new Error("jackpot wire decode failed"));
    }
    if (type === GATEWAY_API_WALLET_USE) {
      const w = tryDecodeWalletUseRequestForDev(raw);
      if (w) {
        return { kind: "WALLET_USE", wallet: w };
      }
      return {
        kind: "WALLET_USE",
        note: "body not decodable as WalletUseRequest; hex only",
        hexPreview: hexPreview(raw, HEX_MAX),
      };
    }
    if (type === GATEWAY_API_LIST_PRODUCTS) {
      try {
        const { products } = decodeListProductsResponseBytes(raw);
        return {
          kind: "LIST_PRODUCTS",
          productCount: products.length,
          productIdsPreview: products.slice(0, 8).map((p) => p.productID),
          productsPaymentTypesPreview: products.slice(0, 6).map((p) => ({
            productID: p.productID,
            paymentTypes: p.paymentTypes,
          })),
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_BUY_PRODUCT) {
      try {
        const { orderID, paymentURL } = decodeBuyProductResponseBytes(raw);
        return {
          kind: "BUY_PRODUCT",
          orderID,
          paymentURLPreview:
            paymentURL.length > 80 ? `${paymentURL.slice(0, 80)}…` : paymentURL,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_MEGA_ACCOUNT_BINDING) {
      try {
        const { phoneNum, needSMSAnswer } =
          decodeMegaAccountBindingResponseBytes(raw);
        return {
          kind: "MEGA_ACCOUNT_BINDING",
          phoneNum,
          needSMSAnswer,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_LIST_PLAYER_AVATARS) {
      try {
        const { avatarsInfo } = decodeListPlayerAvatarsResponseBytes(raw);
        return {
          kind: "LIST_PLAYER_AVATARS",
          avatarCount: avatarsInfo?.length ?? 0,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_UPDATE_PLAYER_AVATAR) {
      return {
        kind: "UPDATE_PLAYER_AVATAR",
        note: "response shape varies; body length",
        byteLength: raw.byteLength,
      };
    }
    if (type === GATEWAY_API_GET_THIRD_PARTY_GAME_INFO) {
      try {
        const { thirdPartyGameInfo } =
          decodeGetThirdPartyGameInfoResponseBytes(raw);
        const url = thirdPartyGameInfo?.gameLaunchURL?.trim() ?? "";
        return {
          kind: "GET_THIRD_PARTY_GAME_INFO",
          hasLaunchURL: Boolean(url),
          url,
          platform: thirdPartyGameInfo?.platform,
          gameUID: thirdPartyGameInfo?.gameUID,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_SEND_MESSAGE_PUSH) {
      const pay = tryDecodeSendMessagePushToPaymentPush(type, raw);
      if (pay) {
        return { kind: "SEND_MESSAGE_PUSH", paymentFinishPush: pay };
      }
      return {
        kind: "SEND_MESSAGE_PUSH",
        note: "not PaymentFinishPush(1013) or inner decode failed",
        hexPreview: hexPreview(raw, HEX_MAX),
      };
    }
    if (type === GATEWAY_API_LIST_WITHDRAW_ORDERS) {
      try {
        const decoded = decodeListWithdrawOrdersResponseBytes(raw);
        return {
          kind: "LIST_WITHDRAW_ORDERS",
          data: decoded,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_CREATE_WITHDRAW_ORDER) {
      try {
        const { withdrawOrderUID } =
          decodeCreateWithdrawOrderResponseBytes(raw);
        return {
          kind: "CREATE_WITHDRAW_ORDER",
          withdrawOrderUID,
        };
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
    if (type === GATEWAY_API_WITHDRAW_SUCCESS_PUSH) {
      try {
        const p = decodeWithdrawSuccessPushBytes(raw);
        if (p) {
          return {
            kind: "WITHDRAW_SUCCESS_PUSH",
            userID: p.userID,
            nickname: p.nickname,
            actualAmount: p.actualAmount,
          };
        }
        return fallbackHex(raw, new Error("WithdrawSuccessPush decode failed"));
      } catch (e) {
        return fallbackHex(raw, e);
      }
    }
  } catch (e) {
    return fallbackHex(raw, e);
  }

  return {
    kind: "unknownType",
    type,
    hexPreview: hexPreview(raw, HEX_MAX),
  };
}

/**
 * 組合 dev 專用的一列 `gateway-ws` 回應物件，不含 `data` 原始 `Uint8Array`。
 */
export function formatGatewayResponseForDevLog(msg: GatewayWsResponseObject) {
  const m = msg as {
    type?: number | string;
    code?: string;
    errMessage?: string;
    data?: unknown;
  };
  const type = Number(m.type);
  const code = String(m.code ?? "");
  const data = m.data;
  const dataByteLength = data instanceof Uint8Array ? data.byteLength : 0;
  const raw = data instanceof Uint8Array ? data : new Uint8Array(0);
  const dataDecoded = decodeGatewayResponseDataForDevLog(type, code, raw);
  return {
    type,
    code,
    errMessage: m.errMessage,
    dataByteLength,
    dataDecoded,
  };
}
