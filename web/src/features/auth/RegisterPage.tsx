import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { MarketingTopBar } from '../../components/MarketingTopBar'
import { ApiError, ClientVersionError } from '../../lib/api/client'
import { buildAppMetaPayload, getOrCreateWebDeviceId, nicknameFromEmail } from '../../lib/appMeta'
import type { SignUpRequest } from '../../lib/api/types'
import './AuthPages.css'

function buildRequest(params: { email: string; password: string; rePassword: string }): SignUpRequest {
  const em = params.email.trim()
  return {
    nickname: nicknameFromEmail(em),
    password: params.password,
    rePassword: params.rePassword,
    answer: '',
    app_meta: buildAppMetaPayload(),
    email: em,
    deviceID: getOrCreateWebDeviceId(),
  }
}

export function RegisterPage() {
  const { signUp, register, ingestAuthResponse, user, ready } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [answer, setAnswer] = useState('')
  const [pending, setPending] = useState<SignUpRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ready && user) {
      navigate('/', { replace: true })
    }
  }, [ready, user, navigate])

  async function onSubmitFirst(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    const body = buildRequest({ email, password, rePassword: password2 })
    try {
      const result = await signUp(body)
      if (result.auth) {
        ingestAuthResponse(result.auth)
        navigate('/', { replace: true })
        return
      }
      if (result.needSMSAnswer) {
        setPending(body)
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

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    if (!pending) return
    setError(null)
    setSubmitting(true)
    try {
      await register({ ...pending, answer: answer.replace(/\s/g, '') })
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

  if (pending) {
    return (
      <div className="auth-layout">
        <MarketingTopBar primary={{ to: '/login', label: 'Log in' }} />
        <div className="page-container auth-page">
          <h1 className="auth-page__title">Verify your email</h1>
          <p className="auth-page__lede">Enter the code sent to {pending.email}.</p>
          <form className="auth-form auth-form--card" onSubmit={onSubmitCode} noValidate>
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor="reg-code">
                Verification code
              </label>
              <input
                id="reg-code"
                className="auth-form__input"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={answer}
                onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
              />
            </div>
            {error ? <p className="auth-form__error">{error}</p> : null}
            <div className="auth-form__actions">
              <button type="submit" className="btn-crown-primary auth-form__submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Complete registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <MarketingTopBar primary={{ to: '/login', label: 'Log in' }} />
      <div className="page-container auth-page">
        <h1 className="auth-page__title">Register</h1>
        <p className="auth-page__lede">Create an account to use the lobby and games.</p>
        <form className="auth-form auth-form--card" onSubmit={onSubmitFirst} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              className="auth-form__input"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              className="auth-form__input"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reg-password2">
              Confirm password
            </label>
            <input
              id="reg-password2"
              className="auth-form__input"
              name="password2"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <div className="auth-form__actions">
            <button type="submit" className="btn-crown-primary auth-form__submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Register'}
            </button>
          </div>
        </form>
        <p className="auth-page__link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
