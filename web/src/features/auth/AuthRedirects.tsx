import { Navigate, useSearchParams } from 'react-router-dom'

export function LoginRedirect() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const q = new URLSearchParams()
  if (redirect) q.set('redirect', redirect)
  q.set('auth', 'login')
  return <Navigate to={`/?${q.toString()}`} replace />
}

export function RegisterRedirect() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const q = new URLSearchParams()
  if (redirect) q.set('redirect', redirect)
  q.set('auth', 'register')
  return <Navigate to={`/?${q.toString()}`} replace />
}

export function ForgotPasswordRedirect() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const q = new URLSearchParams()
  if (redirect) q.set('redirect', redirect)
  q.set('auth', 'forgot')
  return <Navigate to={`/?${q.toString()}`} replace />
}
