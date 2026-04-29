import { DEFAULT_REDEEM_PILL_MESSAGES } from "../../features/lobby/redeemPillMessages";
import { MOCK_GAMES } from "../mockGames";
import type {
  AuthResponse,
  GamesResponse,
  LoginBody,
  SignUpRequest,
  User,
} from "./types";

const DEMO_URL =
  "https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png";
/** mock 內嵌遊戲用輕量可載入頁 */
const GAME_IFRAME_DEMO = "https://en.wikipedia.org/wiki/Special:BlankPage";

const MOCK_THUMBS = [
  "https://static.crowncoinscasino.com/production/assets/games/crownslots/olympics-alternate-all-KXkAo.webp",
  "https://static.crowncoinscasino.com/production/assets/games/playson-infin/pls_coin_strike_xxl-cutThumbnailHr-bUafU.webp",
  "https://static.crowncoinscasino.com/production/assets/games/booming/68b705d3800528273b1057c8-cutThumbnailShortHr-rBBMl.webp",
  "https://static.crowncoinscasino.com/production/assets/games/koala/kg_5009-cutThumbnailShortHr-FAQcd.webp",
  "https://static.crowncoinscasino.com/production/assets/games/penguin-king/103094-cutThumbnailHr-mQKpF.webp",
  "https://static.crowncoinscasino.com/production/assets/games/onseo/1032-cutThumbnailShortHr-hmaJN.webp",
] as const;

const mockUser: User = {
  id: "mock-user-1",
  displayName: "Test player",
  balance: 89800,
  currency: "GC",
  /** 低於 Redeem 門檻，Redeem 頁可顯示 insufficient 卡片（對齊 UI 稿） */
  sweepstakesBalance: 200,
  /** 對應 `public/images/head/head3.png`（mock 大廳頭像） */
  avatarId: 3,
};

let mockState = { ...mockUser };

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

function tokenFor(id: string): string {
  return `mock.jwt.${btoa(encodeURIComponent(id))}`;
}

function mockAuth(account: string): AuthResponse {
  return {
    accessToken: tokenFor(account),
    tokenType: "Bearer",
    refreshToken: `mock.refresh.${btoa(encodeURIComponent(account))}`,
    expiresIn: 3600,
    user: { ...mockState, id: "mock-user-1", displayName: account },
  };
}

export async function mockRegisterFromSignUp(
  body: SignUpRequest,
): Promise<AuthResponse> {
  return delay(mockAuth(body.email));
}

export async function mockRegister(body: SignUpRequest): Promise<AuthResponse> {
  return delay(mockAuth(body.email));
}

export async function mockRefreshToken(
  refreshToken: string,
): Promise<AuthResponse> {
  void refreshToken;
  return delay(mockAuth("refreshed"));
}

export async function mockLogin(body: LoginBody): Promise<AuthResponse> {
  return delay(mockAuth(body.account));
}

export async function mockRequestPasswordReset(): Promise<void> {
  return delay(undefined);
}

export async function mockCompletePasswordReset(): Promise<void> {
  return delay(undefined);
}

export async function mockGetMe(): Promise<User> {
  return delay({ ...mockState });
}

export async function mockGetGames(): Promise<GamesResponse> {
  const items = MOCK_GAMES.map((g, i) => ({
    id: g.id,
    title: g.title,
    subtitle: g.subtitle,
    launchUrl: i % 2 === 0 ? GAME_IFRAME_DEMO : DEMO_URL,
    thumbnailUrl: MOCK_THUMBS[i % MOCK_THUMBS.length],
    embedWidthPercent: 90,
    embedHeightPercent: 85,
  }));
  return delay({ items });
}

export async function mockGetRedeemPillMessages(): Promise<string[]> {
  return delay([...DEFAULT_REDEEM_PILL_MESSAGES], 200);
}

/** 模擬儲值回來後本地餘額+100（僅 mock） */
export function mockBumpBalance(): void {
  mockState = { ...mockState, balance: (mockState.balance ?? 0) + 100 };
}
