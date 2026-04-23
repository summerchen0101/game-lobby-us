import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { MarketingTopBar } from '../../components/MarketingTopBar'
import { ApiError } from '../../lib/api/client'
import './AuthPages.css'

export function RegisterPage() {
  const { register, user, ready } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ready && user) {
      navigate('/', { replace: true })
    }
  }, [ready, user, navigate])

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
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <MarketingTopBar primary={{ to: '/login', label: 'Log in' }} />
      <div className="page-container auth-page">
        <h1 className="auth-page__title">Register</h1>
        <p className="auth-page__lede">Create an account to use the lobby and games.</p>
        <form className="auth-form auth-form--card" onSubmit={onSubmit} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reg-account">
              Account
            </label>
            <input
              id="reg-account"
              className="auth-form__input"
              name="account"
              autoComplete="username"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
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
            <label className="auth-form__label" htmlFor="reg-nick">
              Display name (optional)
            </label>
            <input
              id="reg-nick"
              className="auth-form__input"
              name="displayName"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
