/**
 * `app_meta` 對齊產品規格（如 login_flow.pdf：apk=megarich, version, device, resolution）。
 * `device` 可含平台與 user agent（如 iOS Safari 字串）。
 */
const DEVICE_ID_KEY = 'wynoco_device_id'

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getOrCreateWebDeviceId(): string {
  if (typeof localStorage === 'undefined') return randomId()
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = randomId()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function resolutionBucket(): 'High' | 'Medium' | 'Low' {
  if (typeof window === 'undefined') return 'High'
  const w = window.screen?.width ?? 0
  if (w >= 1200) return 'High'
  if (w >= 768) return 'Medium'
  return 'Low'
}

export type AppMetaPayload = {
  apk: string
  version: string
  device: string
  resolution: 'High' | 'Medium' | 'Low' | string
}

/**
 * 登入／註冊共用的 `app_meta` 物件（扁平欄位，無額外包一層），後端若要求 JSON 字串可在外層 `JSON.stringify`。
 */
export function buildAppMetaPayload(): AppMetaPayload {
  const version = (import.meta.env.VITE_APP_VERSION ?? '0000').toString() || '0000'
  let device = 'web'
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || ''
    const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    const platform = typeof uad?.platform === 'string' ? uad.platform : ''
    const parts = [platform, ua].filter(Boolean)
    device = parts.join(' ').trim() || 'web'
  }
  return {
    apk: 'megarich',
    version,
    device,
    resolution: resolutionBucket(),
  }
}

export const LOGIN_V1_TYPE = 1

export function nicknameFromEmail(email: string): string {
  const i = email.indexOf('@')
  return (i > 0 ? email.slice(0, i) : email).trim() || email
}
