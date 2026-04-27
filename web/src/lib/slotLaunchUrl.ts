import type { User } from './api/types'
import type { ActiveWallet } from '../wallet/walletContext'
import { getUnityWebEntryBase } from './env'

/** GC=1, SC=2（與 Unity WebEntry query 一致） */
export type SlotWalletMode = 1 | 2

export function activeWalletToSlotMode(w: ActiveWallet): SlotWalletMode {
  return w === 'SC' ? 2 : 1
}

export function amountForActiveWallet(
  user: User | null | undefined,
  w: ActiveWallet,
): number {
  if (!user) return 0
  if (w === 'SC') return user.sweepstakesBalance ?? 0
  return user.balance ?? 0
}

export type BuildSlotLaunchUrlInput = {
  gameId: number
  mode: SlotWalletMode
  amount: number
  vipLevel: number
  /** 試玩省略；若帶入則為後端／IAM 核發之 token（格式依後端與 Unity 約定） */
  token?: string | null
  /** 覆寫 WebEntry base；預設見 env */
  baseUrl?: string
}

/**
 * 組出 WebEntry 網址：`game_id`、`mode`、`amount`、`vip_lv`、可選 `token`。
 */
export function buildSlotLaunchUrl(p: BuildSlotLaunchUrlInput): string {
  const base = p.baseUrl?.trim() || getUnityWebEntryBase()
  const u = new URL(base)
  u.searchParams.set('game_id', String(Math.max(0, Math.floor(p.gameId))))
  u.searchParams.set('mode', String(p.mode))
  u.searchParams.set('amount', String(Math.max(0, Math.floor(p.amount))))
  u.searchParams.set('vip_lv', String(Math.max(0, Math.floor(p.vipLevel))))
  const t = p.token?.trim()
  if (t) u.searchParams.set('token', t)
  return u.toString()
}
