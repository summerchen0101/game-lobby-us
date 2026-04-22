/** 佔位資料，之後可替換為 API 回傳型別 */
export type GameCard = {
  id: string
  title: string
  subtitle?: string
}

export const MOCK_GAMES: GameCard[] = [
  { id: '1', title: '範例遊戲 A', subtitle: '即將推出' },
  { id: '2', title: '範例遊戲 B', subtitle: '維護中' },
  { id: '3', title: '範例遊戲 C' },
  { id: '4', title: '範例遊戲 D', subtitle: '熱門' },
  { id: '5', title: '範例遊戲 E' },
  { id: '6', title: '範例遊戲 F' },
]
