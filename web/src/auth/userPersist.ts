import { normalizeUserPayload } from '../lib/api/authParse'
import type { User } from '../lib/api/types'
import { USER_STORAGE_KEY } from './storage'

export function readPersistedUser(): User | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return normalizeUserPayload(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writePersistedUser(user: User | null): void {
  if (typeof localStorage === 'undefined') return
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY)
    return
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}
