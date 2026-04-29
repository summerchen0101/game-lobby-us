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
 * SC 數值為後端「萬分之一」單位（與 withdraw wire / ScPointCurrency 一致）；顯示請用 `formatScFromRaw`／`scRawToDisplay`。
 * `redeemableAmount`：有 coin 且後端給 redeemableAmount 時採用之；無 bag／無 coin 列時視同可提額並採 fallback（與 amount 對齊，mock／無袋資訊用）。
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
  const hasLobbyScCoin = c0 != null && typeof c0 === "object";
  const fromCoinAmount = numFromWire(c0?.amount);
  const fromCoinRedeem = numFromWire(c0?.redeemableAmount);
  const amount =
    fromCoinAmount !== undefined
      ? fromCoinAmount
      : (params.sweepstakesFallback ?? 0);
  const redeemableAmount =
    fromCoinRedeem !== undefined
      ? fromCoinRedeem
      : !hasLobbyScCoin
        ? (params.sweepstakesFallback ?? 0)
        : 0;
  const unplayed = amount - redeemableAmount;
  return { amount, redeemableAmount, unplayed };
}
