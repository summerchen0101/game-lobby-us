import type { ActiveWallet } from "./walletContext";
import type { User } from "../lib/api/types";

/** Header pill: compact thousands for large balances (en-US). */
export function formatWalletPillAmount(n: number | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

/** docs/lobby：ScPointCurrency 換算基準 10000（與 LOBBY_GET currency 欄位對齊） */
function sweepstakesDisplayAmount(
  raw: number | undefined,
  currency: string | undefined,
): number {
  const u = raw ?? 0;
  const c = currency?.trim();
  if (c === "10000" || c === "ScPointCurrency" || Number(c) === 10000) {
    return u / 10000;
  }
  return u;
}

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
  const sc = sweepstakesDisplayAmount(
    user.sweepstakesBalance,
    user.currency,
  );
  return { label: "SC" as const, amount: formatWalletPillAmount(sc) };
}
