import type { ActiveWallet } from "./walletContext";
import type { User } from "../lib/api/types";

/** Header pill: compact thousands for large balances (en-US). */
export function formatWalletPillAmount(n: number | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

/**
 * Sweeps Coins 畫面值：小數第 3 位起無條件捨去（向零截斷），至多顯示兩位（en-US 千分位）。
 * Header SC 與 {@link formatScFromRaw} 共用。
 */
export function formatWalletScAmountForDisplay(n: number | undefined): string {
  if (n === undefined) return "—";
  if (!Number.isFinite(n)) return "—";
  const truncatedTowardZero = Math.trunc(n * 100) / 100;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(truncatedTowardZero);
}

/** LOBBY / redeem wire：後端 SC 整數為「萬分之一」顯示單位（見 ScPointCurrency）。 */
export const SC_POINT_SCALE = 10000;

/** 可提領下限：畫面上的整數 SC。 */
export const MIN_REDEEM_SC_DISPLAY = 50;

/** 可提領下限：後端原始值（= MIN_REDEEM_SC_DISPLAY × SC_POINT_SCALE）。 */
export const MIN_REDEEM_SC_RAW =
  MIN_REDEEM_SC_DISPLAY * SC_POINT_SCALE;

/** 將後端原始 SC（萬分之一）換成畫面上的 SC 數值（可含小數）。 */
export function scRawToDisplay(raw: number): number {
  return raw / SC_POINT_SCALE;
}

/** 後端原始值 → 顯示字串（向零捨去至小數兩位，與 header SC 一致）。 */
export function formatScFromRaw(raw: number | undefined): string {
  if (raw === undefined) return "—";
  return formatWalletScAmountForDisplay(scRawToDisplay(raw));
}

/**
 * List withdraw orders：`amount` 為法幣顯示數值（不經 {@link SC_POINT_SCALE}）。
 */
export function formatWithdrawHistoryFiatAmount(amountWire: string): string {
  const t = String(amountWire ?? "")
    .trim()
    .replace(/,/g, "");
  if (t === "") return "—";
  const n = Number(t);
  return formatWalletScAmountForDisplay(Number.isFinite(n) ? n : undefined);
}

/**
 * Header SC：`sweepstakesBalance` 一律視為後端萬分之一（與 Lobby bag／Redeem 相同），不依賴
 * `user.currency`。避免未帶 ScPointCurrency 時誤將 raw 當畫面值顯示（例如 18000→應為 1.8）。
 */
export function getWalletDisplay(
  user: User | null | undefined,
  active: ActiveWallet,
) {
  if (!user) return { label: active, amount: "—" as string };
  if (active === "GC") {
    return {
      label: "GC" as const,
      amount: formatWalletPillAmount(user.balance),
    };
  }
  return {
    label: "SC" as const,
    amount: formatScFromRaw(user.sweepstakesBalance),
  };
}
