import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { CURRENCY_ICON_SC } from '../../lib/currencyIcons'
import { formatWalletPillAmount } from '../../wallet/formatWalletAmount'
import './RedeemPage.css'
import './SessionPageDecor.css'

export const MIN_REDEEM_SC = 50

const NOTIFY_PILL_TEXT = 'will withdrew $300'

export function RedeemPage() {
  const { user } = useAuth()
  const [infoOpen, setInfoOpen] = useState(false)
  const infoId = useId()

  const sc = user?.sweepstakesBalance ?? 0
  const scDisplay = formatWalletPillAmount(sc)
  const canRedeem = sc >= MIN_REDEEM_SC

  return (
    <section className="redeem-page page-container session-page session-page--pattern">
      <div className="redeem-page__hero">
        <h1 className="redeem-page__title">REDEEM</h1>
        <p className="redeem-page__notify-pill" aria-live="polite">
          {NOTIFY_PILL_TEXT}
        </p>
        <p className="redeem-page__sub">SWEEPSTAKES PRIZE REDEMPTION</p>
      </div>

      <div className="redeem-page__card">
        <div className="redeem-page__row">
          <Link to="/" className="redeem-page__back" aria-label="Back">
            ‹
          </Link>
          <h2 className="redeem-page__row-title">Redeemable Balance:</h2>
          <button
            type="button"
            className="redeem-page__info"
            aria-expanded={infoOpen}
            aria-controls={infoId}
            onClick={() => setInfoOpen((v) => !v)}
            title="Prize redemption info"
          >
            i
          </button>
        </div>

        {infoOpen ? (
          <p id={infoId} className="redeem-page__info-panel">
            Sweepstakes prizes are shown in SC. You need at least {MIN_REDEEM_SC} SC to request a
            redemption. This screen is a UI preview; actual redemption flows to your backend.
          </p>
        ) : null}

        <div className="redeem-page__balance-row">
          <span className="redeem-page__sc-badge" aria-hidden>
            <img src={CURRENCY_ICON_SC} alt="" width={40} height={40} />
          </span>
          <p className="redeem-page__amount">{scDisplay}</p>
        </div>

        {canRedeem ? (
          <p className="redeem-page__ok">You meet the minimum balance for redemption (preview).</p>
        ) : null}
      </div>

      {!canRedeem ? (
        <div className="redeem-page__insufficient-card">
          <h3 className="redeem-page__insufficient-title">Insufficient SC</h3>
          <p className="redeem-page__insufficient-text">
            Win a minimum of {MIN_REDEEM_SC} SC to redeem.
          </p>
          <p className="redeem-page__insufficient-accent">Keep playing!</p>
          <Link to="/" className="redeem-page__to-lobby">
            Back to lobby
          </Link>
        </div>
      ) : null}
    </section>
  )
}
