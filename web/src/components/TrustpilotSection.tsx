import { useEffect, useRef } from 'react'
import './TrustpilotSection.css'

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement | null, refresh?: boolean) => void }
  }
}

type Props = {
  businessUnitId: string
}

let trustpilotScriptPromise: Promise<void> | null = null

function loadTrustpilotScript(): Promise<void> {
  if (trustpilotScriptPromise) return trustpilotScriptPromise
  trustpilotScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-trustpilot-bootstrap]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Trustpilot script failed')), {
        once: true,
      })
      return
    }
    const s = document.createElement('script')
    s.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'
    s.async = true
    s.dataset.trustpilotBootstrap = 'true'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Trustpilot script failed'))
    document.head.appendChild(s)
  })
  return trustpilotScriptPromise
}

export function TrustpilotSection({ businessUnitId }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await loadTrustpilotScript()
        if (cancelled || !ref.current) return
        window.Trustpilot?.loadFromElement(ref.current, true)
      } catch {
        /* optional block */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [businessUnitId])

  return (
    <section className="trustpilot-section" aria-label="Reviews">
      <div className="trustpilot-section__inner">
        <div
          ref={ref}
          className="trustpilot-widget"
          data-locale="zh-TW"
          data-template-id="53aa8912dec7e10d38f59f36"
          data-businessunit-id={businessUnitId}
          data-style-height="140px"
          data-style-width="100%"
          data-theme="dark"
          data-stars="5"
          data-review-languages="en"
        />
      </div>
    </section>
  )
}
