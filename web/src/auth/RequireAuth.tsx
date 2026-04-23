import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { ready, token, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="page-container auth-gate" style={{ paddingBlock: '2rem' }}>
        <p className="auth-gate__text">Loading…</p>
      </div>
    )
  }

  if (!token || !user) {
    const path = location.pathname + location.search
    const q = new URLSearchParams()
    q.set('redirect', path || '/profile')
    q.set('auth', 'login')
    return <Navigate to={`/?${q.toString()}`} replace />
  }

  return <Outlet />
}
