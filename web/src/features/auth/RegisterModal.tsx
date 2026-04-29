import { type FormEvent, useEffect, useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { buildAppMetaPayload, getOrCreateWebDeviceId, nicknameFromEmail } from '../../lib/appMeta'
import { useAuth } from '../../auth/useAuth'
import { ApiError, ClientVersionError } from '../../lib/api/client'
import { useAuthModals } from './authModalsContext'
import type { SignUpRequest } from '../../lib/api/types'
import { AuthClearableInputWrap } from './AuthClearableInputWrap'
import './AuthModals.css'

type Props = {
  open: boolean
  onClose: () => void
  onSwitchLogin: () => void
}

/** Icon when password is hidden — click to reveal. */
function IconEyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  )
}

/** Icon when password is visible — click to hide. */
function IconEyeClosed() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.27-1.13 2.2-2.5 2.7-3.9-1.73-4.39-6-7.5-11-7.5-1.4 0-2.75.25-3.99.7l2.2 2.2C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.05-.2 4.45-.55l.42.42L19.73 22 22 19.73 4.27 2 2 4.27zM7.53 9.8l1.55 1.55c-.05.3-.08.6-.08.9 0 1.66 1.34 3 3 3 .3 0 .6-.04.9-.1l1.55 1.55c-.84.3-1.75.5-2.7.5-2.76 0-5-2.24-5-5 0-.95.2-1.86.5-2.7z" />
    </svg>
  )
}

function maskEmailForDisplay(raw: string): string {
  const em = raw.trim()
  const at = em.indexOf('@')
  if (at <= 0) return em || '—'
  const local = em.slice(0, at)
  const domain = em.slice(at + 1)
  if (local.length <= 1) return `*@${domain}`
  if (local.length === 2) return `${local[0]}*@${domain}`
  return `${local[0]}${'*'.repeat(Math.min(4, local.length - 2))}${local[local.length - 1]}@${domain}`
}

function buildSignUpRequest(params: {
  email: string
  password: string
  rePassword: string
  referrer: string
}): SignUpRequest {
  const em = params.email.trim()
  return {
    nickname: nicknameFromEmail(em),
    password: params.password,
    rePassword: params.rePassword,
    answer: '',
    app_meta: buildAppMetaPayload(),
    email: em,
    deviceID: getOrCreateWebDeviceId(),
    referrerCode: params.referrer.trim() || undefined,
  }
}

export function RegisterModal({ open, onClose, onSwitchLogin }: Props) {
  const { signUp, ingestAuthResponse } = useAuth()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const { openPhoneVerify } = useAuthModals()
  const formId = useId()
  const emailId = `${formId}-email`
  const passwordId = `${formId}-password`
  const password2Id = `${formId}-password2`
  const referralId = `${formId}-referral`
  const termsId = `${formId}-terms`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [_referral, setReferral] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
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
    if (open) {
      setError(null)
    }
  }, [open])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!termsAccepted) {
      setError('Please accept the terms to continue')
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    const body = buildSignUpRequest({
      email,
      password,
      rePassword: passwordConfirm,
      referrer: _referral,
    })
    setSubmitting(true)
    try {
      const result = await signUp(body)
      if (result.auth) {
        ingestAuthResponse(result.auth)
        onClose()
        const redir = searchParams.get('redirect')
        if (redir && redir.startsWith('/') && !redir.startsWith('//')) {
          nav(redir, { replace: true })
        } else {
          nav('/', { replace: true })
        }
        return
      }
      if (result.needSMSAnswer) {
        openPhoneVerify({
          body,
          displayEmail: maskEmailForDisplay(email),
        })
        onClose()
        return
      }
    } catch (err) {
      if (err instanceof ClientVersionError) {
        window.open(err.updateUrl, '_blank', 'noopener,noreferrer')
        setError('A new version is required. A download page was opened in a new tab.')
        return
      }
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y auth-modal auth-modal--register"
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
            Member account registration
          </h2>
        </div>
        <hr className="app-modal__rule" />
        <div className="app-modal__body">
          <form onSubmit={onSubmit} noValidate>
            <fieldset disabled={submitting} className="auth-form-fieldset-reset">
            <label className="auth-modal__field-label auth-modal__field-label--register" htmlFor={emailId}>
              Email:
            </label>
            <AuthClearableInputWrap
              variant="modal"
              value={email}
              onClear={() => setEmail('')}
              clearAriaLabel="Clear email"
            >
              <input
                id={emailId}
                className="auth-modal__input auth-modal__input--register"
                type="email"
                autoComplete="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </AuthClearableInputWrap>

            <label className="auth-modal__field-label auth-modal__field-label--register" htmlFor={passwordId}>
              Password:
            </label>
            <AuthClearableInputWrap
              variant="modal"
              modalWrap="password"
              value={password}
              onClear={() => setPassword('')}
              clearAriaLabel="Clear password"
              suffix={
                <button
                  type="button"
                  className="auth-modal__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              }
            >
              <input
                id={passwordId}
                className="auth-modal__input auth-modal__input--register auth-modal__input--password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Please enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </AuthClearableInputWrap>

            <label className="auth-modal__field-label auth-modal__field-label--register" htmlFor={password2Id}>
              Confirm password:
            </label>
            <AuthClearableInputWrap
              variant="modal"
              modalWrap="password"
              value={passwordConfirm}
              onClear={() => setPasswordConfirm('')}
              clearAriaLabel="Clear confirm password"
            >
              <input
                id={password2Id}
                className="auth-modal__input auth-modal__input--register auth-modal__input--password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
              />
            </AuthClearableInputWrap>

            <label className="auth-modal__field-label auth-modal__field-label--register" htmlFor={referralId}>
              Referral Code (optional):
            </label>
            <AuthClearableInputWrap
              variant="modal"
              value={_referral}
              onClear={() => setReferral('')}
              clearAriaLabel="Clear referral code"
            >
              <input
                id={referralId}
                className="auth-modal__input auth-modal__input--register"
                autoComplete="off"
                placeholder="Referral Code"
                value={_referral}
                onChange={(e) => setReferral(e.target.value)}
              />
            </AuthClearableInputWrap>

            <div className="auth-modal__legal">
              <input
                id={termsId}
                className="auth-modal__checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label className="auth-modal__legal-text" htmlFor={termsId}>
                By creating an account, you agree to our{' '}
                <a className="auth-modal__link" href="#terms" onClick={(e) => e.preventDefault()}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="auth-modal__link" href="#privacy" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </a>
                . You confirm that you are 21+ and a resident of a non-excluded territory.
              </label>
            </div>

            {error ? <p className="auth-modal__error">{error}</p> : null}
            <button type="submit" className="auth-modal__submit" disabled={submitting}>
              {submitting ? '…' : 'REGISTER'}
            </button>
            </fieldset>
          </form>
          <p className="auth-modal__footer">
            Already have an account?{' '}
            <button type="button" className="auth-modal__footer-link" onClick={onSwitchLogin}>
              Login
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
