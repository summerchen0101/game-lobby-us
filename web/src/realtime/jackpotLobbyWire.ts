import * as protobuf from "protobufjs/light.js";
import schema from "../gen/lobby_wire.schema.js";
import { GATEWAY_API_GET_JACKPOT_INFO } from "./gatewayApi";

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`);
  }
  return t;
}

const SlotJackPotInfoType = mustLookup("megaman.SlotJackPotInfo");
const ListJackPotRespType = mustLookup("megaman.ListJackPotResp");

function parseAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(0, Math.round(v));
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  return 0;
}

function awardsTripleFromJpInfoRows(
  rows: unknown[] | undefined,
): readonly [number, number, number] | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const n0 = rowAward(rows[0]);
  const n1 = rowAward(rows[1]);
  const n2 = rowAward(rows[2]);
  if (n0 <= 0 && n1 <= 0 && n2 <= 0) return null;
  return [n0, n1, n2] as const;
}

function rowAward(row: unknown): number {
  if (!row || typeof row !== "object") return 0;
  const r = row as Record<string, unknown>;
  const award = r.award ?? r.Award;
  if (award !== undefined) return parseAmount(award);
  const amount = r.amount ?? r.Amount;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.max(0, Math.round(amount));
  }
  return 0;
}

/** `ListJackPotResp` 解碼後取前三筆 `award` 作為顯示金額；無有效資料時回傳 null */
export function tripleFromListJackPotRespBytes(
  data: Uint8Array,
): readonly [number, number, number] | null {
  try {
    const msg = ListJackPotRespType.decode(data);
    const o = ListJackPotRespType.toObject(msg, {
      longs: String,
      defaults: false,
    }) as { info?: unknown[] };
    return awardsTripleFromJpInfoRows(o.info);
  } catch {
    return null;
  }
}

/**
 * 大廳 JP 顯示用三格。
 * `GET_JACKPOT_INFO`(141) 的 `data` 為 **`ListJackPotResp`**；若以 `SlotJackPotInfo` 解同一串 bytes，
 * protobuf 會把巢狀 message 誤拆成 `jackpot_amounts`，出現看似 tag／value 的數字列（不可用）。
 * **14**／**1043** 常見為 **`SlotJackPotInfo`**，失敗再嘗試 **`ListJackPotResp`**。
 */
export function decodeLobbyJackpotDisplayTriple(
  data: Uint8Array,
  apiType: number,
): readonly [number, number, number] | null {
  if (apiType === GATEWAY_API_GET_JACKPOT_INFO) {
    return tripleFromListJackPotRespBytes(data);
  }
  return (
    decodeSlotJackPotInfoBytes(data) ?? tripleFromListJackPotRespBytes(data)
  );
}

/** 取 jackpot_amounts 前三格；無有效資料時回傳 null */
export function decodeSlotJackPotInfoBytes(
  data: Uint8Array,
): readonly [number, number, number] | null {
  try {
    const msg = SlotJackPotInfoType.decode(data);
    const o = SlotJackPotInfoType.toObject(msg, {
      longs: String,
      defaults: true,
    }) as { jackpotAmounts?: unknown[] };
    const arr = o.jackpotAmounts;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return [
      parseAmount(arr[0]),
      parseAmount(arr[1] ?? 0),
      parseAmount(arr[2] ?? 0),
    ] as const;
  } catch {
    return null;
  }
}

/** 供 dev log 還原 `ListJackPotResp.info` 摘要 */
export function decodeListJackPotRespToObjectForDev(
  data: Uint8Array,
): { infoCount: number; awardsPreview: number[] } | null {
  try {
    const msg = ListJackPotRespType.decode(data);
    const o = ListJackPotRespType.toObject(msg, {
      longs: String,
      defaults: false,
    }) as { info?: unknown[] };
    const rows = o.info;
    if (!Array.isArray(rows)) return { infoCount: 0, awardsPreview: [] };
    const awardsPreview = rows
      .slice(0, 8)
      .map((row) => rowAward(row));
    return { infoCount: rows.length, awardsPreview };
  } catch {
    return null;
  }
}

/** 供 dev log 還原完整 `jackpot_amounts`（`decodeSlotJackPotInfoBytes` 僅回前三格）。 */
export function decodeSlotJackPotInfoToObjectForDev(
  data: Uint8Array,
): { jackpotAmounts: number[] } | null {
  try {
    const msg = SlotJackPotInfoType.decode(data);
    const o = SlotJackPotInfoType.toObject(msg, {
      longs: String,
      defaults: true,
    }) as { jackpotAmounts?: unknown[] };
    const arr = o.jackpotAmounts;
    if (!Array.isArray(arr)) return { jackpotAmounts: [] };
    return { jackpotAmounts: arr.map((v) => parseAmount(v)) };
  } catch {
    return null;
  }
}
