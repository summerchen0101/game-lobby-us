import { type FormEvent, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ApiError, ClientVersionError } from '../../lib/api/client'
import type { RegisterBody } from '../../lib/api/types'
import './AuthModals.css'
import './PhoneVerificationModal.css'

const RESEND_SECONDS = 27
const OTP_MIN_LEN = 4
const OTP_MAX_LEN = 6

type Props = {
  open: boolean
  onClose: () => void
  displayEmail: string
  /** Cleared by provider when closed; when open this must be the pending sign-up (second POST sets `answer`) */
  pendingBody: RegisterBody | null
}

export function PhoneVerificationModal({ open, onClose, displayEmail, pendingBody }: Props) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const formId = useId()
  const otpId = `${formId}-otp`

  const [otp, setOtp] = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setOtp('')
    setError(null)
    setResendLeft(RESEND_SECONDS)
  }, [open])

  useEffect(() => {
    if (!open || resendLeft <= 0) return
    const id = window.setTimeout(() => setResendLeft((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [open, resendLeft])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function onResend() {
    if (resendLeft > 0) return
    setResendLeft(RESEND_SECONDS)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pendingBody) return
    setError(null)
    const code = otp.replace(/\s/g, '')
    if (code.length < OTP_MIN_LEN || code.length > OTP_MAX_LEN) {
      setError(`Enter a code between ${OTP_MIN_LEN} and ${OTP_MAX_LEN} digits`)
      return
    }
    setSubmitting(true)
    try {
      await register({ ...pendingBody, answer: code })
      onClose()
      navigate('/', { replace: true })
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

  if (!open || !pendingBody) return null

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--col phone-verify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-verify-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header phone-verify-modal__header">
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="email-verify-title" className="app-modal__title">
            Verify your email
          </h2>
        </div>
        <hr className="app-modal__rule" />
        <div className="app-modal__body phone-verify-modal__body">
          <p className="auth-modal__text phone-verify-modal__sent">
            We sent a verification code. Reference (email on file):{' '}
            <span className="phone-verify-modal__email">{displayEmail}</span>
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div className="phone-verify-modal__row">
              <label className="phone-verify-modal__otp-label" htmlFor={otpId}>
                Verification code
              </label>
              <div className="phone-verify-modal__input-wrap">
                <input
                  id={otpId}
                  className="phone-verify-modal__otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LEN))}
                />
                <button
                  type="button"
                  className="phone-verify-modal__resend"
                  disabled={resendLeft > 0}
                  onClick={onResend}
                >
                  {resendLeft > 0 ? `Resend (${resendLeft} seconds)` : 'Resend'}
                </button>
              </div>
            </div>

            {error ? <p className="auth-modal__error">{error}</p> : null}
            <button type="submit" className="auth-modal__submit phone-verify-modal__submit" disabled={submitting}>
              {submitting ? '…' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
