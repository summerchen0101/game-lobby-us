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
      aria-label="Install app"
    >
        <p className="pwa-banner__text">
        Install Wynoco to your home screen for a smoother experience.
        </p>
        <div className="pwa-banner__actions">
        <button type="button" className="pwa-banner__btn pwa-banner__btn--primary" onClick={onInstall}>
            Install
          </button>
        <button
          type="button"
          className="pwa-banner__btn pwa-banner__btn--secondary"
          onClick={() => setDismissed(true)}
        >
            Not now
          </button>
        </div>
    </div>
  )
}
