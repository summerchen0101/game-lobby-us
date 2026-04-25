import { getCurrencyIconUrl } from '../lib/currencyIcons'
import type { ActiveWallet } from '../wallet/walletContext'
import './LobbyJackpotStrip.css'

function formatAmount(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

type Props = {
  wallet: ActiveWallet
  /** 三格金額，順序 JACKPOT 1~3 */
  amounts: readonly [number, number, number]
}

export function LobbyJackpotStrip({ wallet, amounts }: Props) {
  const coinSrc = getCurrencyIconUrl(wallet)

  return (
    <div className="lobby-jackpot-strip" aria-label="Progressive jackpots">
      <div className="lobby-jackpot-strip__cluster" role="list">
        {amounts.map((amount, i) => (
          <div
            key={i}
            className="lobby-jackpot-strip__cell"
            role="listitem"
            aria-label={`JACKPOT ${i + 1}`}
          >
            <div className="lobby-jackpot-strip__title">
              <span className="lobby-jackpot-strip__word">JACKPOT</span>
              <span
                className={
                  'lobby-jackpot-strip__index' +
                  (i === 0 ? ' is-one' : i === 1 ? ' is-two' : ' is-three')
                }
                aria-hidden
              >
                {i + 1}
              </span>
            </div>
            <div className="lobby-jackpot-strip__amount-row">
              <img
                className="lobby-jackpot-strip__coin"
                src={coinSrc}
                alt=""
                width={19}
                height={19}
                decoding="async"
              />
              <span className="lobby-jackpot-strip__amount">{formatAmount(amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
