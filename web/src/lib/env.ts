/** 與舊 index.html 行為一致：預設內嵌，true 則遊戲預設新分頁 */
export function openGamesInNewWindowDefault(): boolean {
  return import.meta.env.VITE_OPEN_GAMES_IN_NEW_WINDOW === 'true'
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_API_USE_MOCK === 'true'
}

export function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE ?? '').trim()
  return raw.replace(/\/$/, '')
}

export function trustpilotBusinessUnitId(): string | undefined {
  const v = import.meta.env.VITE_TRUSTPILOT_BUSINESS_UNIT_ID?.trim()
  return v || undefined
}

export function floatingCtaPath(): string {
  const v = import.meta.env.VITE_FLOATING_CTA_PATH?.trim()
  return v || '/profile'
}

const DEFAULT_WS_BASE = 'wss://app-us-alpha.ffglobaltech.com/ws'

/** alpha 預設裝置 id（可經 `VITE_WS_DEVICE_ID` 覆寫） */
const DEFAULT_WS_DEVICE_ID = 'd94ce952-1c75-4c6a-93b9-eb8754f5d623'

/**
 * Gateway WebSocket 完整 URL（含 query：`token`、`deviceid`）。
 * - 基底：`VITE_WS_URL` 或 alpha 預設（建議只寫 `wss://…/ws`，勿手動貼 query）。
 * - `token`：未傳 `params.token` 時沿用基底 URL 上既有 `token`，否則為空字串。
 */
export function getGatewayWsUrl(params?: { token?: string | null }): string {
  const raw = import.meta.env.VITE_WS_URL?.trim() || DEFAULT_WS_BASE
  const u = new URL(raw)
  const deviceId =
    import.meta.env.VITE_WS_DEVICE_ID?.trim() || DEFAULT_WS_DEVICE_ID
  const token =
    params && 'token' in params
      ? (params.token ?? '').trim()
      : (u.searchParams.get('token') ?? '')
  u.searchParams.set('token', token)
  u.searchParams.set('deviceid', deviceId)
  return u.toString()
}

/** 等同 `getGatewayWsUrl()`（無額外 token 參數）。 */
export function getWsUrl(): string {
  return getGatewayWsUrl()
}

const DEFAULT_UNITY_WEBENTRY =
  'https://unityweb-alpha.ffglobaltech.com/0000/WebGL_Build_WebEntry/index.html'

/** Unity WebGL WebEntry（slot query：game_id、mode、amount、vip_lv、token） */
export function getUnityWebEntryBase(): string {
  const v = import.meta.env.VITE_UNITY_WEBENTRY_URL?.trim()
  return v || DEFAULT_UNITY_WEBENTRY
}

/** 大廳是否改走 WebEntry（`VITE_USE_SLOT_WEBENTRY=true`）；非 React hook。 */
export function isSlotWebEntryEnabled(): boolean {
  return import.meta.env.VITE_USE_SLOT_WEBENTRY === 'true'
}

export function unityWebEntryDefaultGameId(): number {
  const raw = import.meta.env.VITE_UNITY_WEBENTRY_GAME_ID?.trim()
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : 85
}

/** 訪客頁聊天 FAB：有值則點擊時 window.open（新分頁）。 */
export function supportChatUrl(): string | undefined {
  const v = import.meta.env.VITE_SUPPORT_CHAT_URL?.trim()
  return v || undefined
}
