import { createContext, useContext } from 'react'

export type ActiveWallet = 'GC' | 'SC'

const STORAGE_KEY = 'wynoco_active_wallet'

export function readStoredWallet(): ActiveWallet {
  if (typeof sessionStorage === 'undefined') return 'GC'
  return sessionStorage.getItem(STORAGE_KEY) === 'SC' ? 'SC' : 'GC'
}

export function writeStoredWallet(w: ActiveWallet): void {
  sessionStorage.setItem(STORAGE_KEY, w)
}

export type WalletContextValue = {
  activeWallet: ActiveWallet
  setActiveWallet: (w: ActiveWallet) => void
}

export const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
