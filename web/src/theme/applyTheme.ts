/** 與 theme-seasonal.css 的 [data-theme="…"] 對應 */
export function setAppTheme(theme: string | null | undefined) {
  const t = theme?.trim()
  if (!t) {
    document.documentElement.removeAttribute('data-theme')
    return
  }
  document.documentElement.dataset.theme = t
}

/** 由 VITE_APP_THEME 套用（main 啟動時呼叫） */
export function applyThemeFromEnv() {
  setAppTheme(import.meta.env.VITE_APP_THEME)
}
