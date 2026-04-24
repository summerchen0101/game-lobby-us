import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { CURRENCY_ICON_SC } from '../../lib/currencyIcons'
import { formatWalletPillAmount } from '../../wallet/formatWalletAmount'
import './RedeemPage.css'
import './SessionPageDecor.css'

export const MIN_REDEEM_SC = 50

const TICKER_TEXT =
  'User won withdrew $300  ·  SWEEPSTAKES PRIZE POOL  ·  Redeemable balance shown in SC'

export function RedeemPage() {
  const { user } = useAuth()
  const [infoOpen, setInfoOpen] = useState(false)
  const infoId = useId()

  const sc = user?.sweepstakesBalance ?? 0
  const scDisplay = formatWalletPillAmount(sc)
  const canRedeem = sc >= MIN_REDEEM_SC

  return (
    <section className="redeem-page page-container session-page session-page--pattern">
      <h1 className="redeem-page__title">REDEEM</h1>
      <div className="redeem-page__ticker-outer" aria-hidden>
        <div className="redeem-page__ticker-track">
          <span>{TICKER_TEXT}</span>
          <span>{TICKER_TEXT}</span>
        </div>
      </div>
      <p className="redeem-page__sub">SWEEPSTAKES PRIZE REDEMPTION</p>

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

        {!canRedeem ? (
          <div className="redeem-page__panel redeem-page__panel--warn">
            <h3 className="redeem-page__panel-title">Insufficient SC.</h3>
            <p className="redeem-page__panel-text">Win a minimum of 50 SC to redeem.</p>
            <p className="redeem-page__accent">Keep playing!</p>
            <Link to="/" className="redeem-page__to-lobby">
              Back to lobby
            </Link>
          </div>
        ) : (
          <p className="redeem-page__ok">You meet the minimum balance for redemption (preview).</p>
        )}
      </div>
    </section>
  )
}
