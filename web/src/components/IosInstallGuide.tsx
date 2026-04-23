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
          Add to Home Screen (iOS)
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
            1. Tap the <b>Share</b> button in the browser bar
            <img
              className="ios-guide__share"
              src="/share-hint.png"
              width={18}
              height={18}
              alt=""
            />
            .
          </p>
          <p>
            2. Scroll down and tap <b>Add to Home Screen</b>.
          </p>
        </div>
        <button type="button" className="ios-guide__dismiss" onClick={close}>
          Continue in the browser
        </button>
      </div>
    </div>
  )
}
