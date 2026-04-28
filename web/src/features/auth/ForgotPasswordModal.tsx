import { type FormEvent, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { IoChevronBack } from 'react-icons/io5'
import {
  completePasswordReset,
  requestPasswordReset,
} from '../../lib/api/auth'
import { ApiError, ClientVersionError } from '../../lib/api/client'
import './AuthModals.css'

type Props = {
  open: boolean
  onClose: () => void
  /** From step A header back, or success → open login modal */
  onSwitchToLogin: () => void
}

type Phase = 'email' | 'form' | 'success'

/** Icon when password is hidden — click to reveal. */
function IconEyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  )
}

function IconEyeClosed() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.27-1.13 2.2-2.5 2.7-3.9-1.73-4.39-6-7.5-11-7.5-1.4 0-2.75.25-3.99.7l2.2 2.2C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.05-.2 4.45-.55l.42.42L19.73 22 22 19.73 4.27 2 2 4.27zM7.53 9.8l1.55 1.55c-.05.3-.08.6-.08.9 0 1.66 1.34 3 3 3 .3 0 .6-.04.9-.1l1.55 1.55c-.84.3-1.75.5-2.7.5-2.76 0-5-2.24-5-5 0-.95.2-1.86.5-2.7z" />
    </svg>
  )
}

const OTP_MIN_LEN = 4
const OTP_MAX_LEN = 6

export function ForgotPasswordModal({ open, onClose, onSwitchToLogin }: Props) {
  const formId = useId()
  const emailId = `${formId}-email`
  const codeId = `${formId}-code`
  const pwdId = `${formId}-pwd`
  const pwd2Id = `${formId}-pwd2`

  const [phase, setPhase] = useState<Phase>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setPhase('email')
    setEmail('')
    setCode('')
    setPassword('')
    setPasswordConfirm('')
    setShowPassword(false)
    setError(null)
  }, [open])

  async function onSendEmail(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email')
      return
    }
    setSubmitting(true)
    try {
      await requestPasswordReset({ email: trimmed })
      setPhase('form')
      setEmail(trimmed)
    } catch (err) {
      if (err instanceof ClientVersionError) {
        window.open(err.updateUrl, '_blank', 'noopener,noreferrer')
        setError('A new version is required. A download page was opened in a new tab.')
        return
      }
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Request failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmitNewPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const c = code.replace(/\s/g, '')
    if (c.length < OTP_MIN_LEN || c.length > OTP_MAX_LEN) {
      setError(`Enter a code between ${OTP_MIN_LEN} and ${OTP_MAX_LEN} characters`)
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await completePasswordReset({
        email,
        password,
        code: c,
      })
      setPhase('success')
    } catch (err) {
      if (err instanceof ClientVersionError) {
        window.open(err.updateUrl, '_blank', 'noopener,noreferrer')
        setError('A new version is required. A download page was opened in a new tab.')
        return
      }
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Reset failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const titleId = 'auth-forgot-dialog-title'
  const headline =
    phase === 'success'
      ? 'Password updated'
      : phase === 'form'
        ? 'Set new password'
        : 'Forgot password'

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal auth-modal--login"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="app-modal__head-row">
          <button
            type="button"
            className="app-modal__head-btn"
            onClick={
              phase === 'form'
                ? () => {
                    setPhase('email')
                    setCode('')
                    setPassword('')
                    setPasswordConfirm('')
                    setError(null)
                  }
                : phase === 'success'
                  ? onClose
                  : onSwitchToLogin
            }
            aria-label={phase === 'email' ? 'Back to login' : 'Back'}
          >
            <IoChevronBack aria-hidden />
          </button>
          <h2 id={titleId} className="app-modal__title--abs-center">
            {headline}
          </h2>
          <button
            type="button"
            className="app-modal__head-btn auth-modal__head-btn--close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          {phase === 'email' ? (
            <form onSubmit={onSendEmail} noValidate>
              <p className="auth-modal__text">
                Enter the email on your account. We will send a verification code you can use to
                choose a new password.
              </p>
              <label
                className="auth-modal__field-label auth-modal__field-label--register"
                htmlFor={emailId}
              >
                Email:
              </label>
              <input
                id={emailId}
                className="auth-modal__input auth-modal__input--register"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Please enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error ? <p className="auth-modal__error">{error}</p> : null}
              <button type="submit" className="auth-modal__submit" disabled={submitting}>
                {submitting ? '…' : 'SEND RESET CODE'}
              </button>
            </form>
          ) : null}

          {phase === 'form' ? (
            <form onSubmit={onSubmitNewPassword} noValidate>
              <p className="auth-modal__text">
                We sent a code to <strong>{email}</strong>. Enter it below with your new password.
              </p>
              <label
                className="auth-modal__field-label auth-modal__field-label--register"
                htmlFor={codeId}
              >
                Verification code:
              </label>
              <input
                id={codeId}
                className="auth-modal__input auth-modal__input--register"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code from email"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <label
                className="auth-modal__field-label auth-modal__field-label--register"
                htmlFor={pwdId}
              >
                New password:
              </label>
              <div className="auth-modal__password-wrap">
                <input
                  id={pwdId}
                  className="auth-modal__input auth-modal__input--register auth-modal__input--password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-modal__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
              <label
                className="auth-modal__field-label auth-modal__field-label--register"
                htmlFor={pwd2Id}
              >
                Confirm new password:
              </label>
              <div className="auth-modal__password-wrap">
                <input
                  id={pwd2Id}
                  className="auth-modal__input auth-modal__input--register auth-modal__input--password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-modal__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
              {error ? <p className="auth-modal__error">{error}</p> : null}
              <button type="submit" className="auth-modal__submit" disabled={submitting}>
                {submitting ? '…' : 'UPDATE PASSWORD'}
              </button>
            </form>
          ) : null}

          {phase === 'success' ? (
            <div>
              <p className="auth-modal__text">Your password has been updated. You can sign in with your new password.</p>
              <button type="button" className="auth-modal__submit" onClick={onSwitchToLogin}>
                BACK TO LOGIN
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
