/** LOBBY_GET `playerInfo.walletType`（與 megaman WalletType 數值對齊） */
export type LobbyWalletType = "UNKNOWN" | "GC" | "SC";

export type User = {
  id: string;
  displayName?: string;
  balance?: number;
  currency?: string;
  /** Sweepstakes / SC coin balance（可選，API 未回傳時前端可顯示 0） */
  sweepstakesBalance?: number;
  /** VIP 等級（WebEntry `vip_lv`；API 未回傳時前端可視為 0） */
  vipLevel?: number;
  /** LOBBY_GET `playerInfo.avatarID`（Item ID，如 401；本地預設圖僅覆蓋 1–10） */
  avatarId?: number;
  /** LOBBY_GET `playerInfo.walletType` */
  lobbyWalletType?: LobbyWalletType;
  /** LOBBY_GET `playerInfo.vipCurrentLevelBetExp` / `vipCurrentLevelBetExpRequired`（VIP 押注經驗條） */
  vipCurrentLevelBetExp?: number;
  vipCurrentLevelBetExpRequired?: number;
  /** LOBBY_GET 根層 `phone` 或 `playerInfo.cellPhone` */
  phone?: string;
  /** LOBBY_GET 頂層 `email`（與後端欄位 20 對齊） */
  email?: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType?: string;
  user?: User;
  /** v1 登入／refresh 可回傳；存於 `localStorage` 供 POST `/api/v1/token` 換發 */
  refreshToken?: string;
  /** 秒，可選，供日後續期計時 */
  expiresIn?: number;
};

/**
 * 與 v1 註冊 `POST /api/v1/signup` 對齊。第一輪 `answer` 可空字串；需驗證時再送同結構並帶上驗證碼。
 */
export type SignUpRequest = {
  nickname: string;
  password: string;
  rePassword: string;
  /** 郵件驗證碼等；首送可 `''` */
  answer: string;
  app_meta: unknown;
  email: string;
  deviceID: string;
  referrerCode?: string;
};

export type SignupResult = {
  needSMSAnswer: boolean;
  /** 不需第二階或後端直接發 token 時帶入 */
  auth?: AuthResponse;
};

export type LoginBody = { account: string; password: string };

export type PasswordResetRequest = { email: string };

/** `POST /api/v1/password/resetInfo` — 信箱驗證碼 + 新密碼 */
export type PasswordResetInfoRequest = {
  email: string;
  password: string;
  code: string;
};

/** 向後相容：註冊表單仍用 `account` 當主要識別時，在送出前可映射到 `email` / `nickname` */
export type RegisterBody = SignUpRequest;

export type Game = {
  id: string;
  title: string;
  subtitle?: string;
  /** 完整遊戲啟動 URL */
  launchUrl: string;
  /** 大廳卡片／橫列縮圖（可選） */
  thumbnailUrl?: string;
  /** LOBBY_GET `GameLabel` 字串（如 HOT），供訪客列分組等 */
  lobbyLabel?: string;
  /** LOBBY_GET megaman.GameCategory 字串（如 SLOT） */
  lobbyCategory?: string;
  /** 第三方／廠商名（LOBBY_GET `providerName`） */
  provider?: string;
  /** LOBBY_GET 各分類排序欄位（依 docs/lobby 選一欄由大到小排序） */
  lobbySortFields?: {
    sort: number;
    hotSort: number;
    slotSort: number;
    cardSort: number;
    fishSort: number;
    arcadeSort: number;
    lotterySort: number;
    battleSort: number;
    classicSort: number;
  };
  embedWidthPercent?: number;
  embedHeightPercent?: number;
  openInNewWindow?: boolean;
  /** `LobbyGet.thirdPartyGameInfoList` 項目：點擊走 GetThirdPartyGameInfo，非站內 launchUrl */
  thirdPartyLaunch?: { platform: string; gameUID: string };
};

export type GamesResponse = { items: Game[] };

export type ApiErrorBody = { message?: string; code?: string };
