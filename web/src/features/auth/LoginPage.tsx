import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
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
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : '登入失敗'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container auth-page">
      <h1 className="auth-page__title">登入</h1>
      <p className="auth-page__lede">輸入帳號與密碼以進入大廳。</p>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="login-account">
            帳號
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
            密碼
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
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? '登入中…' : '登入'}
          </button>
        </div>
      </form>
      <p className="auth-page__link">
        還沒有帳號？ <Link to="/register">註冊</Link>
      </p>
    </div>
  )
}
