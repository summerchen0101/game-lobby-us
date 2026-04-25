import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../lib/api/client'
import './AuthModals.css'

type Props = {
  open: boolean
  onClose: () => void
  onSwitchRegister: () => void
}

export function LoginModal({ open, onClose, onSwitchRegister }: Props) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
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
      await login(account.trim(), password)
      const redirect = searchParams.get('redirect')
      onClose()
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        navigate(redirect, { replace: true })
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign-in failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function stubSocial(label: string) {
    setStubMsg(`${label} sign-in is not available yet`)
  }

  if (!open) return null

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="login-modal-title" className="app-modal__title">
            LOG IN
          </h2>
        </div>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          <div className="auth-modal__social-stack">
            <button
              type="button"
              className="auth-modal__social-btn auth-modal__social-btn--apple"
              onClick={() => stubSocial('Apple')}
            >
              Log in with Apple
            </button>
            <button
              type="button"
              className="auth-modal__social-btn auth-modal__social-btn--google"
              onClick={() => stubSocial('Google')}
            >
              Log in with Google
            </button>
            <button
              type="button"
              className="auth-modal__social-btn auth-modal__social-btn--facebook"
              onClick={() => stubSocial('Facebook')}
            >
              Log in with Facebook
            </button>
          </div>
          <div className="auth-modal__divider">OR</div>
          <form onSubmit={onSubmit} noValidate>
            <label className="auth-modal__field-label" htmlFor="modal-login-email">
              EMAIL
            </label>
            <input
              id="modal-login-email"
              className="auth-modal__input"
              name="account"
              autoComplete="username"
              placeholder="Enter Email"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
            />
            <label className="auth-modal__field-label" htmlFor="modal-login-password">
              PASSWORD
            </label>
            <input
              id="modal-login-password"
              className="auth-modal__input"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="auth-modal__error">{error}</p> : null}
            {stubMsg ? <p className="auth-modal__stub-toast">{stubMsg}</p> : null}
            <button type="submit" className="auth-modal__submit" disabled={submitting}>
              {submitting ? '…' : 'LOG IN'}
            </button>
          </form>
          <p className="auth-modal__footer">
            Forgot your password?{' '}
            <button
              type="button"
              className="auth-modal__footer-link"
              onClick={() => setStubMsg('Password reset is not available yet')}
            >
              CLICK HERE
            </button>
          </p>
          <p className="auth-modal__footer">
            Need an account?{' '}
            <button type="button" className="auth-modal__footer-link" onClick={onSwitchRegister}>
              CREATE ACCOUNT
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
