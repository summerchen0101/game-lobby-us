export type User = {
  id: string
  displayName?: string
  balance?: number
  currency?: string
  /** Sweepstakes / SC coin balance（可選，API 未回傳時前端可顯示 0） */
  sweepstakesBalance?: number
  /** VIP 等級（WebEntry `vip_lv`；API 未回傳時前端可視為 0） */
  vipLevel?: number
}

export type AuthResponse = {
  accessToken: string
  tokenType?: string
  user?: User
  /** v1 登入／refresh 可回傳；存於 `localStorage` 供 POST `/api/v1/token` */
  aRefreshToken?: string
  /** 秒，可選，供日後續期計時 */
  expiresIn?: number
}

/**
 * 與 v1 註冊 `POST /api/v1/signup` 對齊。第一輪 `answer` 可空字串；需驗證時再送同結構並帶上驗證碼。
 */
export type SignUpRequest = {
  nickname: string
  password: string
  rePassword: string
  /** 郵件驗證碼等；首送可 `''` */
  answer: string
  app_meta: unknown
  email: string
  deviceID: string
  referrerCode?: string
}

export type SignupResult = {
  needSMSAnswer: boolean
  /** 不需第二階或後端直接發 token 時帶入 */
  auth?: AuthResponse
}

export type LoginBody = { account: string; password: string }

/** 向後相容：註冊表單仍用 `account` 當主要識別時，在送出前可映射到 `email` / `nickname` */
export type RegisterBody = SignUpRequest

export type ForgotPasswordBody = { email: string }

export type Game = {
  id: string
  title: string
  subtitle?: string
  /** 完整遊戲啟動 URL */
  launchUrl: string
  /** 大廳卡片／橫列縮圖（可選） */
  thumbnailUrl?: string
  /** LOBBY_GET `GameLabel` 字串（如 HOT），供訪客列分組等 */
  lobbyLabel?: string
  embedWidthPercent?: number
  embedHeightPercent?: number
  openInNewWindow?: boolean
}

export type GamesResponse = { items: Game[] }

export type DepositParams = { channel?: string; amount?: string }

export type DepositResponse = {
  url: string
  openInNewWindow?: boolean
}

export type ApiErrorBody = { message?: string; code?: string }
