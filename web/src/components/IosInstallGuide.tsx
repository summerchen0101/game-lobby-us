import { useCallback, useEffect, useState } from 'react'
import './IosInstallGuide.css'

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isStandalonePWA(): boolean {
  if ((navigator as Navigator & { standalone?: boolean }).standalone)
    return true
  if (typeof matchMedia === 'function') {
    if (matchMedia('(display-mode: standalone)').matches) return true
    if (matchMedia('(display-mode: minimal-ui)').matches) return true
  }
  return false
}

const SHOW_DELAY_MS = 10_000

export function IosInstallGuide() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isIOS() || isStandalonePWA()) return
    const t = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  if (!open) return null

  return (
    <div
      className="ios-guide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="ios-guide__card">
        <h2 id="ios-guide-title" className="ios-guide__title">
          iOS 主畫面安裝方式
        </h2>
        <img
          className="ios-guide__icon"
          src="/brand-logo.webp"
          alt=""
          width={80}
          height={80}
          decoding="async"
        />
        <div className="ios-guide__steps">
          <p>
            1. 點瀏覽器網址列旁的<b> 分享</b>圖示
            <img
              className="ios-guide__share"
              src="/share-hint.png"
              width={18}
              height={18}
              alt=""
            />
            。
          </p>
          <p>
            2. 向下滑找到並點選<b>「加入主畫面」</b>。
          </p>
        </div>
        <button type="button" className="ios-guide__dismiss" onClick={close}>
          我先用瀏覽器觀看即可
        </button>
      </div>
    </div>
  )
}
