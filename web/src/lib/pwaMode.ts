/** 是否以已安裝的 PWA（或 iOS 加到主畫面）方式開啟 */
export function isStandalonePWA(): boolean {
  if ((navigator as Navigator & { standalone?: boolean }).standalone)
    return true
  if (typeof matchMedia === 'function') {
    if (matchMedia('(display-mode: standalone)').matches) return true
    if (matchMedia('(display-mode: minimal-ui)').matches) return true
  }
  return false
}
