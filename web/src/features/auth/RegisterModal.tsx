import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../lib/api/client'
import './AuthModals.css'

type Props = {
  open: boolean
  onClose: () => void
  onSwitchLogin: () => void
  showEmailForm: boolean
  onShowEmailForm: () => void
  onBackFromEmail: () => void
}

export function RegisterModal({
  open,
  onClose,
  onSwitchLogin,
  showEmailForm,
  onShowEmailForm,
  onBackFromEmail,
}: Props) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stubMsg, setStubMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setError(null)
      setStubMsg(null)
    }
  }, [open])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({
        account: account.trim(),
        password,
        displayName: displayName.trim() || undefined,
      })
      onClose()
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function stubSocial(label: string) {
    setStubMsg(`${label} sign-up is not available yet`)
  }

  if (!open) return null

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="register-modal-title" className="app-modal__title">
            CREATE ACCOUNT
          </h2>
        </div>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          {!showEmailForm ? (
            <div className="auth-modal__social-stack">
              <button
                type="button"
                className="auth-modal__social-btn auth-modal__social-btn--apple"
                onClick={() => stubSocial('Apple')}
              >
                Sign Up with Apple
              </button>
              <button
                type="button"
                className="auth-modal__social-btn auth-modal__social-btn--google"
                onClick={() => stubSocial('Google')}
              >
                Sign Up with Google
              </button>
              <button
                type="button"
                className="auth-modal__social-btn auth-modal__social-btn--facebook"
                onClick={() => stubSocial('Facebook')}
              >
                Sign Up with Facebook
              </button>
              <button
                type="button"
                className="auth-modal__social-btn auth-modal__social-btn--email"
                onClick={() => {
                  setStubMsg(null)
                  onShowEmailForm()
                }}
              >
                Sign Up with Email
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <label className="auth-modal__field-label" htmlFor="modal-reg-account">
                Account
              </label>
              <input
                id="modal-reg-account"
                className="auth-modal__input"
                autoComplete="username"
                placeholder="Enter account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
              <label className="auth-modal__field-label" htmlFor="modal-reg-password">
                Password
              </label>
              <input
                id="modal-reg-password"
                className="auth-modal__input"
                type="password"
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <label className="auth-modal__field-label" htmlFor="modal-reg-nick">
                Display name (optional)
              </label>
              <input
                id="modal-reg-nick"
                className="auth-modal__input"
                autoComplete="nickname"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {error ? <p className="auth-modal__error">{error}</p> : null}
              <button type="submit" className="auth-modal__submit" disabled={submitting}>
                {submitting ? '…' : 'CREATE ACCOUNT'}
              </button>
              <p className="auth-modal__footer">
                <button type="button" className="auth-modal__footer-link" onClick={onBackFromEmail}>
                  ← Other sign-up options
                </button>
              </p>
            </form>
          )}
          {stubMsg ? <p className="auth-modal__stub-toast">{stubMsg}</p> : null}
          <p className="auth-modal__footer">
            Already have an account?{' '}
            <button type="button" className="auth-modal__footer-link" onClick={onSwitchLogin}>
              LOG IN
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
