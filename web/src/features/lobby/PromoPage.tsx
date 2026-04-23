import { useNavigate } from 'react-router-dom'
import './PromoPage.css'
import './SessionPageDecor.css'

type Promo = {
  id: string
  title: string
  desc: string
  primary: { label: string; action: 'view' | 'shop' }
  secondary?: { label: string; action: 'view' | 'shop' }
}

const PROMOS: Promo[] = [
  {
    id: '1',
    title: 'Welcome missions',
    desc: 'Complete daily goals and unlock extra rewards for your first week.',
    primary: { label: 'VIEW', action: 'view' },
  },
  {
    id: '2',
    title: 'Bonus sweeps',
    desc: 'Limited-time offer for verified accounts — grab free SC in the store.',
    primary: { label: 'GET +20 SC', action: 'shop' },
    secondary: { label: 'VIEW', action: 'view' },
  },
]

export function PromoPage() {
  const nav = useNavigate()

  return (
    <section className="promo-page page-container session-page session-page--pattern">
      <h1 className="promo-page__title">PROMOTIONS</h1>
      <ul className="promo-page__list">
        {PROMOS.map((p) => (
          <li key={p.id} className="promo-page__card">
            <div className="promo-page__art" aria-hidden />
            <div className="promo-page__body">
              <h2 className="promo-page__h">{p.title}</h2>
              <p className="promo-page__desc">{p.desc}</p>
              <div className="promo-page__actions">
                {p.secondary ? (
                  <button
                    type="button"
                    className="promo-page__btn"
                    onClick={() => {
                      if (p.secondary?.action === 'view') {
                        /* TODO: open promo detail or modal when backend exists */
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                  >
                    {p.secondary.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={
                    p.primary.label.startsWith('GET')
                      ? 'promo-page__btn promo-page__btn--sc'
                      : p.primary.label === 'VIEW'
                        ? 'promo-page__btn'
                        : 'promo-page__btn promo-page__btn--gold'
                  }
                  onClick={() => {
                    if (p.primary.action === 'shop') {
                      void nav('/shop')
                      return
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  {p.primary.label}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="promo-page__hint">Promo details and eligibility connect to your backend when ready.</p>
    </section>
  )
}
