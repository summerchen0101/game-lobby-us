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
    artSrc: '/imgs/panel/Panel_Promo/icon_daily.png',
    cta: 'view',
  },
  {
    id: '2',
    title: 'Invite Friends',
    desc: 'Refer friends to earn free sweepstakes coins in the store.',
    artSrc: '/imgs/panel/Panel_Promo/icon_invite.png',
    cta: 'invite',
  },
]

export function PromoPage() {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <section className="promo-page page-container session-page session-page--pattern">
      <h1 className="promo-page__title">PROMOTIONS</h1>
      <ul className="promo-page__list">
        {PROMOS.map((p) => (
          <li key={p.id} className="promo-page__card">
            <div className="promo-page__art">
              <img
                className="promo-page__art-img"
                src={p.artSrc}
                alt=""
                width={320}
                height={220}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="promo-page__body">
              <h2 className="promo-page__h">{p.title}</h2>
              <p className="promo-page__sr-only">{p.desc}</p>
              <div className="promo-page__actions">
                {p.cta === 'view' ? (
                  <button
                    type="button"
                    className="promo-page__btn promo-page__btn--light"
                    onClick={() => {
                      /* TODO: open promo detail or modal when backend exists */
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    aria-label="View daily bonus"
                  >
                    VIEW
                  </button>
                ) : (
                  <button
                    type="button"
                    className="promo-page__btn promo-page__btn--light"
                    onClick={() => {
                      setInviteOpen(true)
                    }}
                    aria-label="Invite friends, get 20 SC"
                  >
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
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="promo-page__hint promo-page__sr-only">
        Promo details and eligibility connect to your backend when ready.
      </p>
      <InviteFriendsModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </section>
  )
}
