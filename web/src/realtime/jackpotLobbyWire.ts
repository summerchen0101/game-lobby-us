import * as protobuf from "protobufjs/light.js";
import type { ActiveWallet } from "../wallet/walletContext";
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

/** backend `JackPotType.SlotJackPot` / proto `SLOT_JACK_POT` */
const WIRE_JACK_POT_TYPE_SLOT = 1;

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

/** 顯示金額：僅 `amount`（見 docs/lobby_jackpot.md），勿用 `award`。 */
function parseRowDisplayAmount(row: Record<string, unknown>): number {
  const amount = row.amount ?? row.Amount;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.max(0, Math.round(amount));
  }
  if (typeof amount === "string" && amount.trim()) {
    const n = Number(amount);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  return 0;
}

function readWireJackPotType(row: Record<string, unknown>): unknown {
  return row.JackPotType ?? row.jackPotType;
}

function isSlotJackPotWireType(raw: unknown): boolean {
  if (raw === WIRE_JACK_POT_TYPE_SLOT || raw === String(WIRE_JACK_POT_TYPE_SLOT))
    return true;
  if (typeof raw === "string") {
    return raw.trim().toUpperCase() === "SLOT_JACK_POT";
  }
  return false;
}

function readWireWalletType(row: Record<string, unknown>): unknown {
  return row.walletType ?? row.WalletType;
}

function rowMatchesActiveWallet(
  row: Record<string, unknown>,
  active: ActiveWallet,
): boolean {
  const w = readWireWalletType(row);
  if (active === "GC") {
    return w === 1 || w === "1" || w === "GC";
  }
  return w === 2 || w === "2" || w === "SC";
}

/**
 * `ListJackPotResp.info`：依 docs/lobby_jackpot.md，Slot JP 以 `award` 1–3 對應 JP1–JP3，
 * 金額用 `amount`；只納入 `SLOT_JACK_POT`；同格重複則最後一筆覆寫。
 * `requireWalletMatch`：為 true 時僅 `walletType` 與 `activeWallet` 一致之列。
 */
function tripleFromJackPotInfoRowsWithWalletFilter(
  rows: unknown[] | undefined,
  activeWallet: ActiveWallet,
  requireWalletMatch: boolean,
): readonly [number, number, number] | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const triple: [number, number, number] = [0, 0, 0];
  let filled = false;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (requireWalletMatch && !rowMatchesActiveWallet(r, activeWallet)) continue;
    if (!isSlotJackPotWireType(readWireJackPotType(r))) continue;
    const awardRaw = r.award ?? r.Award;
    const award =
      typeof awardRaw === "string" ? Number(awardRaw) : Number(awardRaw);
    if (!Number.isFinite(award) || award < 1 || award > 3) continue;
    const idx = award - 1;
    triple[idx] = parseRowDisplayAmount(r);
    filled = true;
  }
  if (!filled) return null;
  if (triple[0] <= 0 && triple[1] <= 0 && triple[2] <= 0) return null;
  return triple;
}

/**
 * 先依目前錢包過濾；若無有效三格則不過濾 `walletType` 重算（後端欄位異常時仍盡量顯示）。
 */
export function tripleFromJackPotInfoRows(
  rows: unknown[] | undefined,
  activeWallet: ActiveWallet,
): readonly [number, number, number] | null {
  return (
    tripleFromJackPotInfoRowsWithWalletFilter(rows, activeWallet, true) ??
    tripleFromJackPotInfoRowsWithWalletFilter(rows, activeWallet, false)
  );
}

export function tripleFromListJackPotRespBytes(
  data: Uint8Array,
  activeWallet: ActiveWallet,
): readonly [number, number, number] | null {
  try {
    const msg = ListJackPotRespType.decode(data);
    const o = ListJackPotRespType.toObject(msg, {
      longs: String,
      defaults: false,
    }) as { info?: unknown[] };
    return tripleFromJackPotInfoRows(o.info, activeWallet);
  } catch {
    return null;
  }
}

export type DecodeLobbyJackpotOptions = {
  wallet: ActiveWallet;
};

/**
 * 大廳 JP 顯示用三格。
 * - `GET_JACKPOT_INFO`(141)：`data` 為 **`ListJackPotResp`**。
 * - Push **14**／**1043**：實務上多為 **`ListJackPotResp`**（與 141 相同）；先解 `ListJackPotResp` 再 **`SlotJackPotInfo`** fallback，避免誤用 `jackpot_amounts` 解出小假數（如 8/2/21）。
 */
export function decodeLobbyJackpotDisplayTriple(
  data: Uint8Array,
  apiType: number,
  options: DecodeLobbyJackpotOptions,
): readonly [number, number, number] | null {
  const { wallet } = options;
  if (apiType === GATEWAY_API_GET_JACKPOT_INFO) {
    return tripleFromListJackPotRespBytes(data, wallet);
  }
  return (
    tripleFromListJackPotRespBytes(data, wallet) ??
    decodeSlotJackPotInfoBytes(data)
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

export type ListJackPotDevRowPreview = {
  amount: number;
  award: unknown;
  jackPotType: unknown;
  walletType: unknown;
};

/** 供 dev log 還原 `ListJackPotResp.info` 摘要（金額為 `amount`，非 `award`） */
export function decodeListJackPotRespToObjectForDev(
  data: Uint8Array,
): { infoCount: number; rowsPreview: ListJackPotDevRowPreview[] } | null {
  try {
    const msg = ListJackPotRespType.decode(data);
    const o = ListJackPotRespType.toObject(msg, {
      longs: String,
      defaults: false,
    }) as { info?: unknown[] };
    const rows = o.info;
    if (!Array.isArray(rows)) return { infoCount: 0, rowsPreview: [] };
    const rowsPreview = rows.slice(0, 8).map((row): ListJackPotDevRowPreview => {
      if (!row || typeof row !== "object") {
        return {
          amount: 0,
          award: null,
          jackPotType: null,
          walletType: null,
        };
      }
      const r = row as Record<string, unknown>;
      return {
        amount: parseRowDisplayAmount(r),
        award: r.award ?? r.Award ?? null,
        jackPotType: readWireJackPotType(r),
        walletType: readWireWalletType(r),
      };
    });
    return { infoCount: rows.length, rowsPreview };
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
