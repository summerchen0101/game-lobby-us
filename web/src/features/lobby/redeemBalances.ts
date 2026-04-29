import type { LobbyGetDecoded } from "../../realtime/lobbyDecode";

function numFromWire(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * 文件：`LobbyGet.bag.coins[0].amount` / `redeemableAmount`；Unplayed = amount - redeemableAmount。
 * 若無 bag 列則 fallback 至登入後帶入的 sweepstakesBalance。
 */
export function redeemScBalancesFromLobby(params: {
  lobbyGet: LobbyGetDecoded | null;
  sweepstakesFallback?: number;
}): {
  amount: number;
  redeemableAmount: number;
  unplayed: number;
} {
  const c0 = params.lobbyGet?.bag?.coins?.[0] as
    | { amount?: unknown; redeemableAmount?: unknown }
    | undefined;
  const fromCoinAmount = numFromWire(c0?.amount);
  const fromCoinRedeem = numFromWire(c0?.redeemableAmount);
  const amount =
    fromCoinAmount !== undefined
      ? fromCoinAmount
      : (params.sweepstakesFallback ?? 0);
  const redeemableAmount =
    fromCoinRedeem !== undefined ? fromCoinRedeem : 0;
  const unplayed = amount - redeemableAmount;
  return { amount, redeemableAmount, unplayed };
}
