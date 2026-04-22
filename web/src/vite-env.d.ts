/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  /** 設為 "true" 時使用內建假 API，不發網路請求 */
  readonly VITE_API_USE_MOCK: string
  /** 內嵌遊戲/金流：預設與新分頁。設為 "true" 則遊戲預設新分頁（可覆寫每款遊戲） */
  readonly VITE_OPEN_GAMES_IN_NEW_WINDOW: string
  readonly VITE_API_PATH_AUTH_REGISTER: string
  readonly VITE_API_PATH_AUTH_LOGIN: string
  readonly VITE_API_PATH_LOBBY_GAMES: string
  readonly VITE_API_PATH_USER_ME: string
  readonly VITE_API_PATH_PAYMENT_DEPOSIT: string
  /** 僅 dev：Vite 將 /api 代理到此目標 */
  readonly VITE_DEV_PROXY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
