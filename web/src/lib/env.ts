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
