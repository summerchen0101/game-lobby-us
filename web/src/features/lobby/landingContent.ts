/** Static marketing assets (URLs from Crown sample; replace for production). */
export const DEFAULT_HERO_IMAGE =
  'https://crowncoinscasino.com/assets/direct_reg_carousel_1-DSLgz1KV.webp'

export function getLobbyHeroImage(): string {
  const u = import.meta.env.VITE_LOBBY_HERO_IMAGE?.trim()
  return u || DEFAULT_HERO_IMAGE
}

export const FLOATING_CTA_IMAGE =
  'https://crowncoinscasino.com/assets/landing-present-float-FhIAs5Kv.png'

export type BenefitItem = { alt: string; label: string; image: string; htmlLabel?: boolean }

export const BENEFITS: BenefitItem[] = [
  {
    alt: 'Safe and Secure',
    label: 'Safe and Secure',
    image: 'https://crowncoinscasino.com/assets/benefit-lock-fFmUkmZG.png',
  },
  {
    alt: 'Easy and Fast Redemption',
    label: 'Easy and Fast Redemption',
    image: 'https://crowncoinscasino.com/assets/benefit-cash-DGxeLdYk.png',
  },
  {
    alt: 'Lowest Play Required',
    label: '<b>Lowest</b> Play Required',
    image: 'https://crowncoinscasino.com/assets/benefit-x1-PUzEn1IQ.png',
    htmlLabel: true,
  },
  {
    alt: 'Top VIP Experience',
    label: 'Top VIP Experience',
    image: 'https://crowncoinscasino.com/assets/benefit-medals-Dn7jJhzB.png',
  },
  {
    alt: '24/7 Customer Support',
    label: '24/7 Customer Support',
    image: 'https://crowncoinscasino.com/assets/benefit-headphones-BwSGQSnP.png',
  },
  {
    alt: 'No Purchase Necessary',
    label: 'No Purchase Necessary',
    image: 'https://crowncoinscasino.com/assets/benefit-slot-iD2nh_zz.png',
  },
]

const P = 'https://static.crowncoinscasino.com/production/assets/provider'

export type ProviderLogo = { alt: string; src: string }

/** First marquee row (LTR scroll). */
export const PROVIDERS_ROW_A: ProviderLogo[] = [
  { alt: 'Spinomenal', src: `${P}/768-btkJK.webp` },
  { alt: 'Sneaky Slots', src: `${P}/943-qCmIN.webp` },
  { alt: 'Hacksaw RGS', src: `${P}/697-pWqaw.webp` },
  { alt: 'Novomatic', src: `${P}/1010-teHgU.webp` },
  { alt: 'Playtech', src: `${P}/595-BRpfK.webp` },
  { alt: 'Red Tiger', src: `${P}/804-BAZkX.webp` },
  { alt: 'Booming', src: `${P}/874-uqyHO.webp` },
  { alt: 'Relax Gaming', src: `${P}/562-mwHye.webp` },
  { alt: 'Galaxys', src: `${P}/876-wMnxg.webp` },
  { alt: 'Evolution', src: `${P}/802-peIYA.webp` },
  { alt: 'Yggdrasil Gaming', src: `${P}/1077-khXUr.webp` },
  { alt: 'Micro Gaming', src: `${P}/661-swFlL.webp` },
]

/** Second marquee row (RTL scroll). */
export const PROVIDERS_ROW_B: ProviderLogo[] = [
  { alt: 'NetEnt', src: `${P}/805-QTerx.webp` },
  { alt: 'Koala', src: `${P}/807-oCIwL.webp` },
  { alt: 'Reel Riot', src: `${P}/702-cACoa.webp` },
  { alt: 'Big Time Gaming', src: `${P}/806-gwMAi.webp` },
  { alt: 'Crownslots', src: `${P}/801-nkksY.webp` },
  { alt: 'Hacksaw', src: `${P}/696-gUGyp.webp` },
  { alt: 'RubyPlay', src: `${P}/74-KrsyP.webp` },
  { alt: 'Penguin King', src: `${P}/1011-Sqpik.webp` },
  { alt: 'Spinomenal', src: `${P}/768-btkJK.webp` },
  { alt: 'Playtech', src: `${P}/595-BRpfK.webp` },
  { alt: 'Novomatic', src: `${P}/1010-teHgU.webp` },
  { alt: 'Relax Gaming', src: `${P}/562-mwHye.webp` },
]
