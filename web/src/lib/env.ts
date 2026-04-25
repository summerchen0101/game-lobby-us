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

/** 訪客頁聊天 FAB：有值則點擊時 window.open（新分頁）。 */
export function supportChatUrl(): string | undefined {
  const v = import.meta.env.VITE_SUPPORT_CHAT_URL?.trim()
  return v || undefined
}
