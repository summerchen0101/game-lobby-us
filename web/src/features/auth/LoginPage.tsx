import { type FormEvent, useMemo, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { MarketingTopBar } from '../../components/MarketingTopBar'
import { ApiError } from '../../lib/api/client'
import { AuthClearableInputWrap } from './AuthClearableInputWrap'
import './AuthPages.css'

export function LoginPage() {
  const { login, user, ready } = useAuth()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const redirectTo = search.get('redirect') || '/'
  const forgotPasswordHref = useMemo(() => {
    const rd = search.get('redirect')
    if (!rd) return '/forgot-password'
    const q = new URLSearchParams()
    q.set('redirect', rd)
    return `/forgot-password?${q.toString()}`
  }, [search])
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ready && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [ready, user, redirectTo, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(account.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign-in failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <MarketingTopBar
        primary={{ to: '/register', label: 'Register' }}
        secondary={{ to: '/login', label: 'Log in' }}
      />
      <div className="page-container auth-page">
        <h1 className="auth-page__title">Log in</h1>
        <p className="auth-page__lede">Enter your account and password to open the lobby.</p>
        <form className="auth-form auth-form--card" onSubmit={onSubmit} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="login-account">
              Account
            </label>
            <AuthClearableInputWrap
              variant="page"
              value={account}
              onClear={() => setAccount('')}
              clearAriaLabel="Clear account"
            >
              <input
                id="login-account"
                className="auth-form__input"
                name="account"
                autoComplete="username"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
            </AuthClearableInputWrap>
          </div>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="login-password">
              Password
            </label>
            <AuthClearableInputWrap
              variant="page"
              value={password}
              onClear={() => setPassword('')}
              clearAriaLabel="Clear password"
            >
              <input
                id="login-password"
                className="auth-form__input"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </AuthClearableInputWrap>
          </div>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <div className="auth-form__actions">
            <button type="submit" className="btn-crown-primary auth-form__submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </div>
        </form>
        <p className="auth-page__link">
          <Link to={forgotPasswordHref}>Forgot password?</Link>
          {' · '}
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
