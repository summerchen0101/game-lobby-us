import type { ActiveWallet } from "./walletContext";
import type { User } from "../lib/api/types";

/** Header pill: compact thousands for large balances (en-US). */
export function formatWalletPillAmount(n: number | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
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
  const sc = user.sweepstakesBalance;
  return { label: "SC" as const, amount: formatWalletPillAmount(sc ?? 0) };
}
