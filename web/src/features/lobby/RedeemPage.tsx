import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { formatWalletPillAmount } from "../../wallet/formatWalletAmount";
import { RedeemNotifyPill } from "./RedeemNotifyPill";
import { useRedeemPillMessages } from "./useRedeemPillMessages";
import "./RedeemPage.css";
import "./SessionPageDecor.css";

const SC_INLINE_PX = 18;

function ScInlineIcon() {
  return (
    <img
      className="redeem-page__info-sc-icon"
      src={CURRENCY_ICON_SC}
      alt=""
      width={SC_INLINE_PX}
      height={SC_INLINE_PX}
    />
  );
}

export const MIN_REDEEM_SC = 50;

export function RedeemPage() {
  const { user } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);
  const infoId = useId();
  const pillMessages = useRedeemPillMessages();

  const sc = user?.sweepstakesBalance ?? 0;
  const redeemableSc = 0;
  const unplayedSc = sc - redeemableSc;
  const scDisplay = formatWalletPillAmount(sc);
  const canRedeem = sc >= MIN_REDEEM_SC;

  return (
    <section className="redeem-page page-container session-page session-page--pattern">
      <div className="redeem-page__hero">
        <h1 className="redeem-page__title">REDEEM</h1>
        <RedeemNotifyPill messages={pillMessages} />
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
            title="Prize redemption info">
            i
          </button>
        </div>

        {infoOpen ? (
          <div id={infoId} className="redeem-page__info-panel">
            <p>
              <strong>Your Sweeps Coins Balance:</strong>{" "}
              {formatWalletPillAmount(sc)} <ScInlineIcon />
            </p>
            <p>
              <strong>Redeemable Sweeps Coins:</strong>{" "}
              {formatWalletPillAmount(redeemableSc)} <ScInlineIcon />
            </p>
            <p>
              <strong>Unplayed Sweeps Coins Balance:</strong>{" "}
              {formatWalletPillAmount(unplayedSc)} <ScInlineIcon />
            </p>
            <p>
              <ScInlineIcon /> 1 Sweeps Coin = $1
            </p>
            <p>
              Unplayed Sweeps Coins from purchases and bonuses can be used to
              play in games, but cannot be redeemed. Sweeps Coins gained by
              winnings can be redeemed.
            </p>
          </div>
        ) : null}

        <div className="redeem-page__balance-row">
          <span className="redeem-page__sc-badge" aria-hidden>
            <img src={CURRENCY_ICON_SC} alt="" width={40} height={40} />
          </span>
          <p className="redeem-page__amount">{scDisplay}</p>
        </div>

        {canRedeem ? (
          <p className="redeem-page__ok">
            You meet the minimum balance for redemption (preview).
          </p>
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
  );
}
