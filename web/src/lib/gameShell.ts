import { openGamesInNewWindowDefault } from './env'

/** 與舊 `index.html` 相近：iOS 或 PWA 獨立模式 */
export function isIOSorStandalonePWA(): boolean {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
  const standalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    (typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches))
  return isIos || !!standalone
}

/** 與根目錄 `index.html` 內遊戲/金流 iframe 一致 */
const ALLOW_NON_PAYMENT = 'fullscreen *; screen-wake-lock *'
const ALLOW_PAYMENT = `payment *; fullscreen *; screen-wake-lock *; clipboard-read *; clipboard-write *`

export function buildIframeAllow(isPayment: boolean | undefined): string {
  return isPayment ? ALLOW_PAYMENT : ALLOW_NON_PAYMENT
}

/**
 * 遊戲是否以新分頁開啟。後端可傳 `openInNewWindow`；未傳則讀
 * `VITE_OPEN_GAMES_IN_NEW_WINDOW`（對應舊的 `OPEN_GAMES_IN_NEW_WINDOW_DEFAULT`）。
 */
export function shouldOpenInNewWindow(explicit: boolean | undefined): boolean {
  if (explicit === true) return true
  if (explicit === false) return false
  return openGamesInNewWindowDefault()
}
