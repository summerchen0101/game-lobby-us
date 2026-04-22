import { MOCK_GAMES } from '../mockGames'
import type {
  AuthResponse,
  DepositResponse,
  GamesResponse,
  LoginBody,
  RegisterBody,
  User,
} from './types'

const DEMO_URL = 'https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png'
/** mock 內嵌遊戲用輕量可載入頁 */
const GAME_IFRAME_DEMO = 'https://en.wikipedia.org/wiki/Special:BlankPage'

const mockUser: User = {
  id: 'mock-user-1',
  displayName: '測試玩家',
  balance: 1000,
  currency: 'TWD',
}

let mockState = { ...mockUser }

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms))
}

function tokenFor(account: string): string {
  return `mock.jwt.${btoa(encodeURIComponent(account))}`
}

export async function mockRegister(body: RegisterBody): Promise<AuthResponse> {
  return delay({
    accessToken: tokenFor(body.account),
    tokenType: 'Bearer',
    user: { ...mockState, id: 'mock-user-1', displayName: body.displayName ?? body.account },
  })
}

export async function mockLogin(body: LoginBody): Promise<AuthResponse> {
  return delay({
    accessToken: tokenFor(body.account),
    tokenType: 'Bearer',
    user: { ...mockState },
  })
}

export async function mockGetMe(): Promise<User> {
  return delay({ ...mockState })
}

export async function mockGetGames(): Promise<GamesResponse> {
  const items = MOCK_GAMES.map((g, i) => ({
    id: g.id,
    title: g.title,
    subtitle: g.subtitle,
    launchUrl: i % 2 === 0 ? GAME_IFRAME_DEMO : DEMO_URL,
    embedWidthPercent: 90,
    embedHeightPercent: 85,
  }))
  return delay({ items })
}

export async function mockDeposit(returnUrl: string): Promise<DepositResponse> {
  const u = new URL('https://www.wikipedia.org/wiki/Payment')
  u.searchParams.set('mock', '1')
  u.searchParams.set('return', returnUrl)
  return delay({ url: u.toString(), openInNewWindow: false })
}

/** 模擬儲值回來後本地餘額+100（僅 mock） */
export function mockBumpBalance(): void {
  mockState = { ...mockState, balance: (mockState.balance ?? 0) + 100 }
}
