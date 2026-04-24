/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 檔期主題 id，寫入 <html data-theme>；對應 theme-seasonal.css */
  readonly VITE_APP_THEME?: string
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
  /** 大廳「Single1 (Alpha)」內嵌試玩 URL（可覆寫預設 alpha 站） */
  readonly VITE_UNITY_DEMO_URL?: string
  /** 大廳主視覺圖 URL（可覆寫預設 sample 圖） */
  readonly VITE_LOBBY_HERO_IMAGE?: string
  /** Trustpilot Business Unit ID；未設則不載入 widget */
  readonly VITE_TRUSTPILOT_BUSINESS_UNIT_ID?: string
  /** 浮動 CTA 點擊導向（預設 /profile） */
  readonly VITE_FLOATING_CTA_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
