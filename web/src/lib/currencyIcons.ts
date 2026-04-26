import type { ActiveWallet } from '../wallet/walletContext'

export const CURRENCY_ICON_GC = '/images/currency/icon_GC.png'
export const CURRENCY_ICON_SC = '/images/currency/icon_SC.png'

export function getCurrencyIconUrl(kind: ActiveWallet): string {
  return kind === 'GC' ? CURRENCY_ICON_GC : CURRENCY_ICON_SC
}
