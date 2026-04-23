export type User = {
  id: string
  displayName?: string
  balance?: number
  currency?: string
  /** Sweepstakes / SC coin balance（可選，API 未回傳時前端可顯示 0） */
  sweepstakesBalance?: number
}

export type AuthResponse = {
  accessToken: string
  tokenType?: string
  user?: User
}

export type LoginBody = { account: string; password: string }

export type RegisterBody = {
  account: string
  password: string
  displayName?: string
}

export type Game = {
  id: string
  title: string
  subtitle?: string
  /** 完整遊戲啟動 URL */
  launchUrl: string
  /** 大廳卡片／橫列縮圖（可選） */
  thumbnailUrl?: string
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
