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
  /** Gateway WebSocket 基底（建議不含 query；`token`/`deviceid` 由程式組裝） */
  readonly VITE_WS_URL?: string
  /** WebSocket query `deviceid`；不設則用 alpha 內建預設 UUID */
  readonly VITE_WS_DEVICE_ID?: string
  /** Unity WebGL WebEntry（slot）；預設 alpha WebEntry 路徑 */
  readonly VITE_UNITY_WEBENTRY_URL?: string
  /** 設為 "true" 時大廳試玩改走 WebEntry 並帶 game_id／mode／amount／vip_lv／token */
  readonly VITE_USE_SLOT_WEBENTRY?: string
  /** WebEntry 預設 slot 編號（預設 85） */
  readonly VITE_UNITY_WEBENTRY_GAME_ID?: string
  /**
   * 僅 dev：`LandingPage` 是否自動連 Gateway WS 並 `console` 記錄。
   * 設為 `"false"` 可關閉；production build 一律不連線。
   */
  readonly VITE_DEV_GATEWAY_WS?: string
  /** 僅 dev：連上後是否自動送 LOBBY_GET；`"false"` 關閉 */
  readonly VITE_DEV_LOBBY_GET?: string
  /** 寫入 Gateway RequestBasic.clientVer */
  readonly VITE_CLIENT_VER?: string
  /** 已登入時大廳遊戲列表改由 WS LOBBY_GET 解碼結果驅動（需能連上 Gateway） */
  readonly VITE_USE_WS_LOBBY_GAMES?: string
  /** 大廳主視覺圖 URL（可覆寫預設 sample 圖） */
  readonly VITE_LOBBY_HERO_IMAGE?: string
  /** 訪客首頁 hero 圖；未設則沿用 VITE_LOBBY_HERO_IMAGE／預設 */
  readonly VITE_GUEST_HERO_IMAGE?: string
  /** 訪客頁聊天 FAB：完整 URL，點擊時新分頁開啟 */
  readonly VITE_SUPPORT_CHAT_URL?: string
  /** Trustpilot Business Unit ID；未設則不載入 widget */
  readonly VITE_TRUSTPILOT_BUSINESS_UNIT_ID?: string
  /** 浮動 CTA 點擊導向（預設 /profile） */
  readonly VITE_FLOATING_CTA_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
