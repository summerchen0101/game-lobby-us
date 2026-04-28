import * as protobuf from "protobufjs/light.js";
import type { User } from "../lib/api/types";
import schema from "../gen/lobby_wire.schema.js";
import {
  GATEWAY_API_PAYMENT_FINISH_PUSH,
  GATEWAY_API_SEND_MESSAGE_PUSH,
} from "./gatewayApi";
import { wireUInt64Field } from "./wireUint64";

export { wireUInt64Field };

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`shop wire: missing message type ${name}`);
  }
  return t;
}

const ListProductsRequestType = mustLookup("megaman.ListProductsRequest");
const ListProductsResponseType = mustLookup("megaman.ListProductsResponse");
const BuyProductRequestType = mustLookup("megaman.BuyProductRequest");
const BuyProductResponseType = mustLookup("megaman.BuyProductResponse");
const MegaAccountBindingRequestType = mustLookup(
  "megaman.MegaAccountBindingRequest",
);
const MegaAccountBindingResponseType = mustLookup(
  "megaman.MegaAccountBindingResponse",
);
const MsgRespType = mustLookup("megaman.MsgResp");
const PaymentPushType = mustLookup("megaman.PaymentPush");

export function encodeListProductsRequestBytes(): Uint8Array {
  const msg = ListProductsRequestType.create({});
  return Uint8Array.from(ListProductsRequestType.encode(msg).finish());
}

export type MegaAccountBindingRequestFields = {
  userID: bigint | number | string;
  countryCode: string;
  phone: string;
  email: string;
  answer: string;
  firstName: string;
  lastName: string;
  birthday: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  language: string;
};

export function encodeMegaAccountBindingRequestBytes(
  fields: MegaAccountBindingRequestFields,
): Uint8Array {
  const uid = wireUInt64Field(fields.userID);
  const msg = {
    userID: uid,
    phone: fields.phone,
    countryCode: fields.countryCode,
    email: fields.email,
    password: "",
    answer: fields.answer,
    firstName: fields.firstName,
    lastName: fields.lastName,
    birthday: fields.birthday,
    address: fields.address,
    country: fields.country,
    city: fields.city,
    state: fields.state,
    zip: fields.zip,
    language: fields.language,
  };
  const err = MegaAccountBindingRequestType.verify(msg);
  if (err) throw new Error(`MegaAccountBindingRequest: ${err}`);
  const created = MegaAccountBindingRequestType.create(msg);
  return Uint8Array.from(MegaAccountBindingRequestType.encode(created).finish());
}

export function encodeBuyProductRequestBytes(
  productID: bigint | number | string,
  paymentType: bigint | number | string,
): Uint8Array {
  const pid = wireUInt64Field(productID);
  const pt = wireUInt64Field(paymentType);
  const err = BuyProductRequestType.verify({
    productID: pid,
    paymentType: pt,
  });
  if (err) throw new Error(`BuyProductRequest: ${err}`);
  const msg = BuyProductRequestType.create({
    productID: pid,
    paymentType: pt,
  });
  return Uint8Array.from(BuyProductRequestType.encode(msg).finish());
}

const wireToObjectOpts = {
  longs: String,
  defaults: true,
  enums: String,
} as const;

/**
 * 僅供 dev 日誌：解 `MegaAccountBindingRequest`（失敗時由呼叫端 try/catch）。
 */
export function decodeMegaAccountBindingRequestForDevLog(
  raw: Uint8Array,
): Record<string, unknown> {
  const msg = MegaAccountBindingRequestType.decode(raw);
  const o = MegaAccountBindingRequestType.toObject(msg, wireToObjectOpts) as {
    userID?: string | number;
    countryCode?: string;
    phone?: string;
    email?: string;
    answer?: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
    address?: string;
    country?: string;
    city?: string;
    state?: string;
    zip?: string;
    language?: string;
  };
  return {
    userID: String(o.userID ?? ""),
    countryCode: String(o.countryCode ?? ""),
    phone: String(o.phone ?? ""),
    email: String(o.email ?? ""),
    answer: String(o.answer ?? ""),
    firstName: String(o.firstName ?? ""),
    lastName: String(o.lastName ?? ""),
    birthday: String(o.birthday ?? ""),
    address: String(o.address ?? ""),
    country: String(o.country ?? ""),
    city: String(o.city ?? ""),
    state: String(o.state ?? ""),
    zip: String(o.zip ?? ""),
    language: String(o.language ?? ""),
  };
}

/**
 * 僅供 dev 日誌：解 `BuyProductRequest`（失敗時由呼叫端 try/catch）。
 */
export function decodeBuyProductRequestForDevLog(
  raw: Uint8Array,
): Record<string, unknown> {
  const msg = BuyProductRequestType.decode(raw);
  const o = BuyProductRequestType.toObject(msg, wireToObjectOpts) as {
    productID?: string | number;
    paymentType?: string | number;
  };
  return {
    productID: String(o.productID ?? ""),
    paymentType: String(o.paymentType ?? ""),
  };
}

/**
 * 僅供 dev 日誌：解 `ListProductsRequest`（失敗時由呼叫端 try/catch）。
 */
export function decodeListProductsRequestForDevLog(
  raw: Uint8Array,
): Record<string, unknown> {
  const msg = ListProductsRequestType.decode(raw);
  return ListProductsRequestType.toObject(msg, wireToObjectOpts) as Record<
    string,
    unknown
  >;
}

export type ListProductsWireProduct = {
  productID: string;
  originalPrice: string;
  price: string;
  paymentTypes: string[];
  productContents: Record<string, unknown>[];
};

export type ListProductsWireResult = {
  products: ListProductsWireProduct[];
};

export function decodeListProductsResponseBytes(
  data: Uint8Array,
): ListProductsWireResult {
  const msg = ListProductsResponseType.decode(data);
  const o = ListProductsResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  }) as {
    products?: Array<{
      productID?: string | number;
      originalPrice?: string;
      price?: string;
      paymentTypes?: Array<string | number>;
      productContents?: Record<string, unknown>[];
    }>;
  };
  const products: ListProductsWireProduct[] = (o.products ?? []).map((p) => ({
    productID: String(p.productID ?? "0"),
    originalPrice: String(p.originalPrice ?? ""),
    price: String(p.price ?? ""),
    paymentTypes: (p.paymentTypes ?? []).map((x) => String(x)),
    productContents: p.productContents ?? [],
  }));
  return { products };
}

export type BuyProductWireResult = {
  orderID: string;
  paymentURL: string;
};

export type MegaAccountBindingWireResult = {
  phoneNum: string;
  needSMSAnswer: boolean;
};

function yesNoWireToBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (typeof v === "string" && v.toUpperCase() === "YES") return true;
  return false;
}

export function decodeMegaAccountBindingResponseBytes(
  data: Uint8Array,
): MegaAccountBindingWireResult {
  const msg = MegaAccountBindingResponseType.decode(data);
  const o = MegaAccountBindingResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  }) as { phoneNum?: string; needSMSAnswer?: string | number };
  return {
    phoneNum: String(o.phoneNum ?? ""),
    needSMSAnswer: yesNoWireToBool(o.needSMSAnswer),
  };
}

export function decodeBuyProductResponseBytes(
  data: Uint8Array,
): BuyProductWireResult {
  const msg = BuyProductResponseType.decode(data);
  const o = BuyProductResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  }) as { orderID?: string; paymentURL?: string };
  return {
    orderID: String(o.orderID ?? ""),
    paymentURL: String(o.paymentURL ?? ""),
  };
}

export type PaymentPushWire = Record<string, unknown>;

/** 自 PaymentPush.coin 推導 Header 顯示用餘額（GOLDEN→balance、TOKEN→sweepstakesBalance）。 */
export function userPatchFromPaymentPush(
  push: PaymentPushWire,
): Partial<User> | null {
  const coin = push.coin as
    | { type?: string | number; amount?: string | number }
    | undefined;
  if (!coin) return null;
  const rawAmt = coin.amount;
  const amt =
    typeof rawAmt === "string"
      ? Number(rawAmt)
      : typeof rawAmt === "number"
        ? rawAmt
        : Number(rawAmt ?? NaN);
  if (!Number.isFinite(amt)) return null;
  const ty = coin.type;
  const n =
    typeof ty === "number"
      ? ty
      : ty === "GOLDEN"
        ? 1
        : ty === "TOKEN"
          ? 2
          : Number(ty);
  if (n === 1 || ty === "GOLDEN") return { balance: amt };
  if (n === 2 || ty === "TOKEN") return { sweepstakesBalance: amt };
  return null;
}

/**
 * 解 SEND_MESSAGE_PUSH（1000）payload：MsgResp → apiType 1013 → PaymentPush。
 * 非付款完成推播或解碼失敗時回 null。
 */
export function tryDecodeSendMessagePushToPaymentPush(
  responseType: number,
  data: Uint8Array | undefined,
): PaymentPushWire | null {
  if (Number(responseType) !== GATEWAY_API_SEND_MESSAGE_PUSH) return null;
  if (!(data instanceof Uint8Array) || data.byteLength === 0) return null;
  let msgResp: protobuf.Message;
  try {
    msgResp = MsgRespType.decode(data);
  } catch {
    return null;
  }
  const outer = MsgRespType.toObject(msgResp, {
    longs: String,
    defaults: true,
    enums: String,
  }) as {
    msg?: { apiType?: string | number; data?: Uint8Array };
  };
  const inner = outer.msg;
  if (!inner) return null;
  const apiType = Number(inner.apiType ?? 0);
  if (apiType !== GATEWAY_API_PAYMENT_FINISH_PUSH) return null;
  const innerData = inner.data;
  if (!(innerData instanceof Uint8Array) || innerData.byteLength === 0) {
    return null;
  }
  try {
    const pay = PaymentPushType.decode(innerData);
    return PaymentPushType.toObject(pay, {
      longs: String,
      defaults: true,
      enums: String,
    }) as PaymentPushWire;
  } catch {
    return null;
  }
}
