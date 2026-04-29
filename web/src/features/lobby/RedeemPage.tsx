import { useState } from "react";
import { Link } from "react-router-dom";
import { InfoPopover } from "../../components/InfoPopover";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { formatWalletPillAmount } from "../../wallet/formatWalletAmount";
import { RedeemNotifyPill } from "./RedeemNotifyPill";
import { useRedeemPillMessages } from "./useRedeemPillMessages";
import { RedeemMethodModal } from "./RedeemMethodModal";
import "./RedeemPage.css";
import "./SessionPageDecor.css";

const SC_INLINE_PX = 18;

const MOCK_REDEMPTION_HISTORY = [
  { id: "1", description: "1BankTransfer", status: "Rejected" as const },
  { id: "2", description: "2BankTransfer", status: "Rejected" as const },
  { id: "3", description: "1BankTransfer", status: "Rejected" as const },
  { id: "4", description: "2BankTransfer", status: "Rejected" as const },
];

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
  const pillMessages = useRedeemPillMessages();
  const [methodModalOpen, setMethodModalOpen] = useState(false);

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
          <InfoPopover
            align="end"
            panelClassName="redeem-page__info-popover"
            content={
              <div className="redeem-page__info-panel">
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
            }>
            {(p, triggerRef) => (
              <button
                ref={triggerRef}
                {...p}
                className="redeem-page__info"
                aria-label="Prize redemption info">
                i
              </button>
            )}
          </InfoPopover>
        </div>

        <div className="redeem-page__balance-row">
          <span className="redeem-page__sc-badge" aria-hidden>
            <img src={CURRENCY_ICON_SC} alt="" width={40} height={40} />
          </span>
          <p className="redeem-page__amount">{scDisplay}</p>
        </div>
      </div>

      {canRedeem ? (
        <div className="redeem-page__card redeem-page__history-card">
          <h2 className="redeem-page__history-title">Redemption History:</h2>
          <ul className="redeem-page__history-list" aria-label="Redemption history">
            {MOCK_REDEMPTION_HISTORY.map((row) => (
              <li key={row.id} className="redeem-page__history-row">
                <span className="redeem-page__history-icon" aria-hidden>
                  i
                </span>
                <span className="redeem-page__history-desc">{row.description}</span>
                <span className="redeem-page__history-status">{row.status}</span>
              </li>
            ))}
          </ul>
          <div className="redeem-page__history-pager">
            <button
              type="button"
              className="redeem-page__history-pager-btn"
              aria-label="Previous page"
              disabled>
              ‹
            </button>
            <button
              type="button"
              className="redeem-page__history-pager-link"
              onClick={() => {
                /* placeholder until history API */
              }}>
              For older redemption requests
            </button>
            <button
              type="button"
              className="redeem-page__history-pager-btn"
              aria-label="Next page"
              disabled>
              ›
            </button>
          </div>
          <button
            type="button"
            className="redeem-page__new-redeem"
            onClick={() => setMethodModalOpen(true)}>
            NEW REDEEM
          </button>
        </div>
      ) : null}

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

      <RedeemMethodModal
        open={methodModalOpen}
        onClose={() => setMethodModalOpen(false)}
      />
    </section>
  );
}
