import type { CSSProperties, KeyboardEvent } from 'react'
import { useState } from 'react'
import { CURRENCY_ICON_SC } from '../../lib/currencyIcons'
import { InviteFriendsModal } from './InviteFriendsModal'
import './PromoPage.css'
import './SessionPageDecor.css'

const PROMOS: {
  id: string
  title: string
  desc: string
  artSrc: string
  cta: 'view' | 'invite'
}[] = [
  {
    id: '1',
    title: 'Daily Bonus',
    desc: 'Open daily bonus rewards and claim your free credits.',
    artSrc: '/images/promo/icon_daily.png',
    cta: 'view',
  },
  {
    id: '2',
    title: 'Invite Friends',
    desc: 'Refer friends to earn free sweepstakes coins in the store.',
    artSrc: '/images/promo/icon_invite.png',
    cta: 'invite',
  },
]

export function PromoPage() {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <section className="promo-page page-container session-page session-page--pattern">
      <div className="promo-page__inner">
        <h1 className="promo-page__title">PROMOTIONS</h1>
        <ul className="promo-page__list">
          {PROMOS.map((p) => (
            <li key={p.id}>
              <PromoCard
                artSrc={p.artSrc}
                title={p.title}
                desc={p.desc}
                cta={p.cta}
                ariaLabel={
                  p.cta === 'view'
                    ? 'View daily bonus'
                    : 'Invite friends, get 20 SC'
                }
                onActivate={() => {
                  if (p.cta === 'view') {
                    /* TODO: open promo detail or modal when backend exists */
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    setInviteOpen(true)
                  }
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      <p className="promo-page__hint promo-page__sr-only">
        Promo details and eligibility connect to your backend when ready.
      </p>
      <InviteFriendsModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </section>
  )
}

function PromoCard({
  artSrc,
  title,
  desc,
  cta,
  ariaLabel,
  onActivate,
}: {
  artSrc: string
  title: string
  desc: string
  cta: 'view' | 'invite'
  ariaLabel: string
  onActivate: () => void
}) {
  const cardStyle = {
    '--promo-card-bg': `url("${artSrc}")`,
  } as CSSProperties

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return
    }
    e.preventDefault()
    onActivate()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="promo-page__card"
      style={cardStyle}
      onClick={onActivate}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
    >
      <div className="promo-page__body">
        <h2 className="promo-page__h">{title}</h2>
        <p className="promo-page__sr-only">{desc}</p>
        <div className="promo-page__actions" aria-hidden>
          {cta === 'view' ? (
            <span className="promo-page__btn promo-page__btn--light">
              VIEW
            </span>
          ) : (
            <span className="promo-page__btn promo-page__btn--light">
              <span className="promo-page__btn-label">GET+20</span>
              <span className="promo-page__btn-sc" aria-hidden>
                <img
                  src={CURRENCY_ICON_SC}
                  alt=""
                  className="promo-page__btn-sc-icon"
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
