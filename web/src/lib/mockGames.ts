/** 佔位資料，之後可替換為 API 回傳型別 */
export type GameCard = {
  id: string
  title: string
  subtitle?: string
}

export const MOCK_GAMES: GameCard[] = [
  { id: 'mock-1', title: 'Olympia Gold', subtitle: 'Hot' },
  { id: 'mock-2', title: 'Ember Rush', subtitle: 'Jackpot' },
  { id: 'mock-3', title: 'Treasure Blast' },
  { id: 'mock-4', title: 'Lucky Spin' },
  { id: 'mock-5', title: 'Fire Storm', subtitle: 'Hot' },
  { id: 'mock-6', title: 'Nile Fortune' },
  { id: 'mock-7', title: 'Crystal Reels' },
  { id: 'mock-8', title: 'Phoenix Rises' },
  { id: 'mock-9', title: 'Midas Touch', subtitle: 'Jackpot' },
  { id: 'mock-10', title: 'Sapphire Slots' },
  { id: 'mock-11', title: 'Wild West Fire', subtitle: 'Fire' },
  { id: 'mock-12', title: 'Neon Night' },
  { id: 'mock-13', title: 'Dragon Hoard' },
  { id: 'mock-14', title: 'Crown Jewels' },
  { id: 'mock-15', title: 'Fruit Frenzy Hot', subtitle: 'Hot' },
  { id: 'mock-16', title: 'Cosmic Clusters' },
  { id: 'mock-17', title: 'Jungle King' },
  { id: 'mock-18', title: 'Ice Vault' },
  { id: 'mock-19', title: 'Golden Fortune', subtitle: 'Jackpot' },
  { id: 'mock-20', title: 'Mystic Orbs' },
  { id: 'mock-21', title: 'Turbo Reels' },
  { id: 'mock-22', title: 'Pirate Bounty' },
  { id: 'mock-23', title: 'Sahara Riches' },
  { id: 'mock-24', title: 'Lava Loot', subtitle: 'Hot' },
  { id: 'mock-25', title: 'Aurora Wins' },
  { id: 'mock-26', title: 'High Roller' },
  { id: 'mock-27', title: 'Desert Gold' },
  { id: 'mock-28', title: 'Emerald City', subtitle: 'Fire' },
]
