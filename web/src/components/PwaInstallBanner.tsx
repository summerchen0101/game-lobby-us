import { useCallback, useEffect, useState } from 'react'
import './PwaInstallBanner.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const onInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  if (dismissed || !deferred) return null

  return (
    <div
      className="pwa-banner"
      role="dialog"
      aria-label="安裝應用程式"
    >
        <p className="pwa-banner__text">
        安裝 Wynoco 到主畫面，體驗更順暢。
        </p>
        <div className="pwa-banner__actions">
        <button type="button" className="pwa-banner__btn pwa-banner__btn--primary" onClick={onInstall}>
            立即安裝
          </button>
        <button
          type="button"
          className="pwa-banner__btn pwa-banner__btn--secondary"
          onClick={() => setDismissed(true)}
        >
            稍後
          </button>
        </div>
    </div>
  )
}
