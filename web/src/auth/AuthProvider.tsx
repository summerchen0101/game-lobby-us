import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCurrentUser, login as apiLogin, register as apiRegister } from '../lib/api/auth'
import { setUnauthorizedHandler } from '../lib/api/client'
import type { RegisterBody, User } from '../lib/api/types'
import { AuthContext } from './auth-context'
import { TOKEN_STORAGE_KEY } from './storage'

function getInitialToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const initial = getInitialToken()
  const [token, setToken] = useState<string | null>(initial)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState((): boolean => !initial)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setReady(true)
    navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [logout, navigate])

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      return
    }
    const u = await fetchCurrentUser(token)
    setUser(u)
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    setReady(false)
    fetchCurrentUser(token)
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (account: string, password: string) => {
    const res = await apiLogin({ account, password })
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken)
    setToken(res.accessToken)
    if (res.user) {
      setUser(res.user)
      return
    }
    const u = await fetchCurrentUser(res.accessToken)
    setUser(u)
  }, [])

  const register = useCallback(async (body: RegisterBody) => {
    const res = await apiRegister(body)
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken)
    setToken(res.accessToken)
    if (res.user) {
      setUser(res.user)
      return
    }
    const u = await fetchCurrentUser(res.accessToken)
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, ready, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
