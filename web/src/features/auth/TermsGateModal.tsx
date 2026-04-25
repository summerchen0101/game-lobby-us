import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './AuthModals.css'

type Props = {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export function TermsGateModal({ open, onClose, onAccept }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="terms-gate-title" className="app-modal__title">
            YOU ARE ALMOST THERE
          </h2>
        </div>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          <p className="auth-modal__text">
            To start playing, you need to accept our{' '}
            <a className="auth-modal__link" href="#terms" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>{' '}
            &amp;{' '}
            <a className="auth-modal__link" href="#privacy" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>{' '}
            (which include a provision requiring arbitration of disputes).
          </p>
          <p className="auth-modal__text">
            By using our site, you confirm you&apos;re 18+ and not a resident of an excluded
            territory.
          </p>
          <div className="auth-modal__accept">
            <button type="button" className="auth-modal__btn-accept" onClick={onAccept}>
              ACCEPT
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
