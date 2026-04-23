import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  WalletContext,
  type ActiveWallet,
  readStoredWallet,
  writeStoredWallet,
} from './walletContext'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [activeWallet, setActiveWalletState] = useState<ActiveWallet>(() => readStoredWallet())

  const setActiveWallet = useCallback((w: ActiveWallet) => {
    writeStoredWallet(w)
    setActiveWalletState(w)
  }, [])

  const value = useMemo(
    () => ({ activeWallet, setActiveWallet }),
    [activeWallet, setActiveWallet],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
