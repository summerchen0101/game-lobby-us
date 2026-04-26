/** Preset head icons; replace with `/images/...` or CDN URL when final art is in repo */
export type ProfileAvatar = {
  id: string
  imageSrc: string
}

const MOCK_THUMBS = [
  "https://static.crowncoinscasino.com/production/assets/games/crownslots/olympics-alternate-all-KXkAo.webp",
  "https://static.crowncoinscasino.com/production/assets/games/playson-infin/pls_coin_strike_xxl-cutThumbnailHr-bUafU.webp",
  "https://static.crowncoinscasino.com/production/assets/games/booming/68b705d3800528273b1057c8-cutThumbnailShortHr-rBBMl.webp",
  "https://static.crowncoinscasino.com/production/assets/games/koala/kg_5009-cutThumbnailShortHr-FAQcd.webp",
  "https://static.crowncoinscasino.com/production/assets/games/penguin-king/103094-cutThumbnailHr-mQKpF.webp",
  "https://static.crowncoinscasino.com/production/assets/games/onseo/1032-cutThumbnailShortHr-hmaJN.webp",
] as const

export const PROFILE_AVATARS: readonly ProfileAvatar[] = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `preset-${i + 1}`,
    imageSrc: MOCK_THUMBS[i % MOCK_THUMBS.length]!,
  }),
)

export function getProfileAvatarById(id: string | null | undefined): ProfileAvatar | undefined {
  if (!id) return undefined
  return PROFILE_AVATARS.find((a) => a.id === id)
}
