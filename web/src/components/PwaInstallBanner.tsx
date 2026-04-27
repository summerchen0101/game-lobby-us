import { useCallback, useEffect, useState } from 'react'
import { isStandalonePWA } from '../lib/pwaMode'
import './PwaInstallBanner.css'

const SESSION_KEY = 'pwa_install_prompt_dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readSessionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeSessionDismissed() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(readSessionDismissed)

  useEffect(() => {
    if (isStandalonePWA()) return
    const onBip = (e: Event) => {
      if (isStandalonePWA()) return
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const dismiss = useCallback(() => {
    writeSessionDismissed()
    setDismissed(true)
  }, [])

  const onInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  if (isStandalonePWA() || dismissed || !deferred) return null

  return (
    <div
      className="pwa-install"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div className="pwa-install__card">
        <p id="pwa-install-title" className="pwa-install__text">
          安裝「Wynoco」到主畫面，體驗更好喔！
        </p>
        <div className="pwa-install__actions">
          <button
            type="button"
            className="pwa-install__btn pwa-install__btn--primary"
            onClick={onInstall}
          >
            立即安裝
          </button>
          <button
            type="button"
            className="pwa-install__btn pwa-install__btn--secondary"
            onClick={dismiss}
          >
            下次再說
          </button>
        </div>
      </div>
    </div>
  )
}
