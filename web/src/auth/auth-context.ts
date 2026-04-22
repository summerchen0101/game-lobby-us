import { createContext } from 'react'
import type { RegisterBody, User } from '../lib/api/types'

export type AuthContextValue = {
  user: User | null
  token: string | null
  ready: boolean
  login: (account: string, password: string) => Promise<void>
  register: (body: RegisterBody) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
