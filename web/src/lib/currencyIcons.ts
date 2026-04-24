import type { ActiveWallet } from '../wallet/walletContext'

export const CURRENCY_ICON_GC = '/imgs/others/icon_GC.png'
export const CURRENCY_ICON_SC = '/imgs/others/icon_SC.png'

export function getCurrencyIconUrl(kind: ActiveWallet): string {
  return kind === 'GC' ? CURRENCY_ICON_GC : CURRENCY_ICON_SC
}
