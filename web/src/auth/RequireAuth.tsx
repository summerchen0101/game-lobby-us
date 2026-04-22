import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { ready, token, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="page-container auth-gate" style={{ paddingBlock: '2rem' }}>
        <p className="auth-gate__text">載入中…</p>
      </div>
    )
  }

  if (!token || !user) {
    const redirect = location.pathname + location.search
    const search =
      redirect && redirect !== '/login' ? `?${new URLSearchParams({ redirect })}` : ''
    return <Navigate to={`/login${search}`} replace />
  }

  return <Outlet />
}
