import { createContext } from 'react'
import type { AuthResponse, RegisterBody, SignupResult, User } from '../lib/api/types'

export type AuthContextValue = {
  user: User | null
  token: string | null
  ready: boolean
  login: (account: string, password: string) => Promise<void>
  /** 第一階或第二階註冊；第二階需帶 `answer` */
  signUp: (body: RegisterBody) => Promise<SignupResult>
  register: (body: RegisterBody) => Promise<void>
  /** 已取得的 `AuthResponse`（如註冊首輪即回 token）寫入 session */
  ingestAuthResponse: (res: AuthResponse) => void
  logout: () => void
  refreshUser: () => Promise<void>
  /** 與 LOBBY_GET 等來源合併玩家欄位並持久化 */
  mergeUser: (patch: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
