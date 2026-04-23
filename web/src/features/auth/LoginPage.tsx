import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { MarketingTopBar } from '../../components/MarketingTopBar'
import { ApiError } from '../../lib/api/client'
import './AuthPages.css'

export function LoginPage() {
  const { login, user, ready } = useAuth()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const redirectTo = search.get('redirect') || '/'
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
            <input
              id="login-account"
              className="auth-form__input"
              name="account"
              autoComplete="username"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
            />
          </div>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="login-password">
              Password
            </label>
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
          </div>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <div className="auth-form__actions">
            <button type="submit" className="btn-crown-primary auth-form__submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </div>
        </form>
        <p className="auth-page__link">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
