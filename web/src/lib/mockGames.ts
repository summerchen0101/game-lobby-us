/** 佔位資料，之後可替換為 API 回傳型別 */
export type GameCard = {
  id: string
  title: string
  subtitle?: string
}

export const MOCK_GAMES: GameCard[] = [
  { id: '1', title: 'Sample game A', subtitle: 'Coming soon' },
  { id: '2', title: 'Sample game B', subtitle: 'Maintenance' },
  { id: '3', title: 'Sample game C' },
  { id: '4', title: 'Sample game D', subtitle: 'Hot' },
  { id: '5', title: 'Sample game E' },
  { id: '6', title: 'Sample game F' },
]
