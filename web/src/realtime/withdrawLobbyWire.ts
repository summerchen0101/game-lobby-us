import * as protobuf from "protobufjs/light.js";
import schema from "../gen/lobby_wire.schema.js";
import { wireUInt64Field } from "./wireUint64";

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`withdraw wire: missing message type ${name}`);
  }
  return t;
}

const ListWithdrawOrdersReqType = mustLookup("megaman.ListWithdrawOrdersReq");
const ListWithdrawOrdersRespType = mustLookup("megaman.ListWithdrawOrdersResp");
const CreateWithdrawOrderReqType = mustLookup("megaman.CreateWithdrawOrderReq");
const CreateWithdrawOrderRespType = mustLookup(
  "megaman.CreateWithdrawOrderResp",
);
const WithdrawSuccessPushType = mustLookup("megaman.WithdrawSuccessPush");

/**
 * megaman CreateWithdrawOrderReq.paymentType — 對齊 proto/dsk/dsk.proto PaymentTypeRec（美國提現）
 *
 * 若後端 log 出現 `paymentType: 2` 而前端已選 PayPal：多為 **舊 bundle**（曾誤將 paypal 映成 2，對應 PaymentTypeRec.OVO）。
 * 目前預期：PayPal=13、CreditCard=14、CashAPP=15、ACH=16。
 *
 * 後端若以 [`proto/payment/payment.proto`](../../../proto/payment/payment.proto) 全文 merge（含 email/phone 等 21–32），與 megaman wire **並存**時仍以 **field 3** 為準；仍報錯請對齊 **amount 單位／必填／業務規則**。
 */
export const WITHDRAW_PAYMENT_TYPE_REC = {
  PayPal: 13,
  CreditCard: 14,
  CashAPP: 15,
  ACH: 16,
} as const;

/** megaman ListWithdrawOrdersReq.withdrawOrderPaymentStatusIn（對齊 payment.proto 0–7） */
export const ALL_WITHDRAW_ORDER_PAYMENT_STATUSES: readonly number[] = [
  0, 1, 2, 3, 4, 5, 6, 7,
];

const wireToObjectOpts = {
  longs: String,
  defaults: true,
  enums: String,
} as const;

/** megaman ListWithdrawOrdersRespWithdrawOrder.withdrawOrderPaymentStatus（int32）顯示用 */
export function withdrawOrderPaymentStatusToLabel(raw: unknown): string {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : typeof raw === "string"
        ? Number(raw.trim())
        : NaN;
  const mapNum: Record<number, string> = {
    0: "Unknown",
    1: "Reviewing",
    2: "Passed",
    3: "Rejected",
    4: "Processing",
    5: "Success",
    6: "Failed",
    7: "Expired",
  };
  if (Number.isFinite(n) && mapNum[n as keyof typeof mapNum]) {
    return mapNum[n as keyof typeof mapNum];
  }
  const s =
    typeof raw === "string"
      ? raw.trim()
      : typeof raw === "number"
        ? String(raw)
        : "";
  const mapName: Record<string, string> = {
    UnknownWithdrawOrderPaymentStatus: "Unknown",
    Reviewing: "Reviewing",
    Passed: "Passed",
    Rejected: "Rejected",
    Proccessing: "Processing",
    Success: "Success",
    Failed: "Failed",
    ExpirationRejected: "Expired",
  };
  return mapName[s] ?? (s || "Unknown");
}

export function encodeListWithdrawOrdersRequestBytes(
  page: number,
  perPage: number,
): Uint8Array {
  const msg = {
    userIDIn: [] as number[],
    withdrawOrderPaymentStatusIn: [...ALL_WITHDRAW_ORDER_PAYMENT_STATUSES],
    startedAtTimestampMillisecond: 0,
    endedAtTimestampMillisecond: 0,
    page: Math.floor(page),
    perPage: Math.floor(perPage),
  };
  const err = ListWithdrawOrdersReqType.verify(msg);
  if (err) throw new Error(`ListWithdrawOrdersReq: ${err}`);
  const created = ListWithdrawOrdersReqType.create(msg);
  return Uint8Array.from(ListWithdrawOrdersReqType.encode(created).finish());
}

export type WithdrawOrderWireRow = {
  withdrawOrderUID: string;
  amount: string;
  withdrawOrderPaymentStatus: string;
  statusLabel: string;
};

export type ListWithdrawOrdersWireResult = {
  orders: WithdrawOrderWireRow[];
  total: string;
};

export function decodeListWithdrawOrdersResponseBytes(
  data: Uint8Array,
): ListWithdrawOrdersWireResult {
  const msg = ListWithdrawOrdersRespType.decode(data);
  const o = ListWithdrawOrdersRespType.toObject(msg, wireToObjectOpts) as {
    total?: string | number;
    withdrawOrders?: Array<{
      withdrawOrderUID?: string;
      amount?: string | number;
      withdrawOrderPaymentStatus?: string | number;
    }>;
  };
  const rows = o.withdrawOrders ?? [];
  const orders: WithdrawOrderWireRow[] = rows.map((row) => {
    const st = row.withdrawOrderPaymentStatus;
    const statusStr =
      typeof st === "string" ? st : typeof st === "number" ? String(st) : "";
    return {
      withdrawOrderUID: String(row.withdrawOrderUID ?? ""),
      amount: String(row.amount ?? ""),
      withdrawOrderPaymentStatus: statusStr,
      statusLabel: withdrawOrderPaymentStatusToLabel(st),
    };
  });
  const totalRaw = o.total;
  const total =
    totalRaw !== undefined && totalRaw !== null ? String(totalRaw) : "0";
  return { orders, total };
}

export type CreateWithdrawOrderWireFields = {
  /** 對齊 CreateWithdrawOrderReq.userID；未給則送 0 */
  userID?: bigint | number | string;
  /** 整數 SC 字串（megaman amount 為 string） */
  amount: bigint | number | string;
  /** proto/dsk/dsk.proto PaymentTypeRec（PayPal=13、CreditCard=14、CashAPP=15、ACH=16） */
  paymentType: number;
  cardNumber?: string;
  cardValidCode?: string;
  paypalEmail?: string;
  accountNumber?: string;
  routingNumber?: string;
  appAccount?: string;
};

function amountToWireString(amount: bigint | number | string): string {
  if (typeof amount === "bigint") return amount.toString();
  if (typeof amount === "number" && Number.isFinite(amount))
    return String(Math.trunc(amount));
  const t = String(amount ?? "")
    .trim()
    .replace(/,/g, "");
  return t;
}

export function encodeCreateWithdrawOrderRequestBytes(
  fields: CreateWithdrawOrderWireFields,
): Uint8Array {
  const amtStr = amountToWireString(fields.amount);
  const pt = Math.floor(fields.paymentType);
  const uid =
    fields.userID !== undefined && String(fields.userID).trim() !== ""
      ? wireUInt64Field(fields.userID)
      : 0;
  /**
   * megaman CreateWithdrawOrderReq：欄位號 1→2→3，再依類型填 101–106（與 proto/megaman/payment.proto 宣告順序一致）。
   */
  const msg: Record<string, unknown> = {
    userID: uid,
    amount: amtStr,
    paymentType: pt,
  };
  switch (pt) {
    case WITHDRAW_PAYMENT_TYPE_REC.PayPal: {
      msg.paypalEmail = fields.paypalEmail ?? "";
      break;
    }
    case WITHDRAW_PAYMENT_TYPE_REC.CreditCard: {
      msg.cardNumber = fields.cardNumber ?? "";
      msg.cardValidCode = fields.cardValidCode ?? "";
      break;
    }
    case WITHDRAW_PAYMENT_TYPE_REC.CashAPP: {
      msg.appAccount = fields.appAccount ?? "";
      break;
    }
    case WITHDRAW_PAYMENT_TYPE_REC.ACH: {
      msg.accountNumber = fields.accountNumber ?? "";
      msg.routingNumber = fields.routingNumber ?? "";
      break;
    }
    default:
      break;
  }
  const err = CreateWithdrawOrderReqType.verify(msg);
  if (err) throw new Error(`CreateWithdrawOrderReq: ${err}`);
  const created = CreateWithdrawOrderReqType.create(msg);
  return Uint8Array.from(CreateWithdrawOrderReqType.encode(created).finish());
}

export type CreateWithdrawOrderWireResult = {
  withdrawOrderUID: string;
};

export function decodeCreateWithdrawOrderResponseBytes(
  data: Uint8Array,
): CreateWithdrawOrderWireResult {
  const msg = CreateWithdrawOrderRespType.decode(data);
  const o = CreateWithdrawOrderRespType.toObject(msg, wireToObjectOpts) as {
    withdrawOrderUID?: string;
  };
  return { withdrawOrderUID: String(o.withdrawOrderUID ?? "") };
}

export type WithdrawSuccessPushWire = {
  userID?: string;
  nickname: string;
  actualAmount: number;
};

export function decodeWithdrawSuccessPushBytes(
  data: Uint8Array,
): WithdrawSuccessPushWire | null {
  if (!(data instanceof Uint8Array) || data.byteLength === 0) return null;
  try {
    const msg = WithdrawSuccessPushType.decode(data);
    const o = WithdrawSuccessPushType.toObject(msg, wireToObjectOpts) as {
      userID?: string | number;
      nickname?: string;
      actualAmount?: string | number;
    };
    const uidRaw = o.userID;
    const userID =
      uidRaw !== undefined && uidRaw !== null ? String(uidRaw) : undefined;
    const nick = String(o.nickname ?? "").trim();
    const amtRaw = o.actualAmount;
    const amtStr =
      typeof amtRaw === "string"
        ? amtRaw.trim()
        : amtRaw !== undefined && amtRaw !== null
          ? String(amtRaw)
          : "";
    const n = Number(amtStr);
    if (!Number.isFinite(n)) return null;
    return {
      userID,
      nickname: nick || "Someone",
      actualAmount: n,
    };
  } catch {
    return null;
  }
}

export function decodeListWithdrawOrdersRequestForDevLog(
  raw: Uint8Array,
): Record<string, unknown> {
  const msg = ListWithdrawOrdersReqType.decode(raw);
  return ListWithdrawOrdersReqType.toObject(msg, wireToObjectOpts) as Record<
    string,
    unknown
  >;
}

export function decodeCreateWithdrawOrderRequestForDevLog(
  raw: Uint8Array,
): Record<string, unknown> {
  const msg = CreateWithdrawOrderReqType.decode(raw);
  return CreateWithdrawOrderReqType.toObject(msg, wireToObjectOpts) as Record<
    string,
    unknown
  >;
}
