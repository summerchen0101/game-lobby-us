import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getWalletDisplay } from '../../wallet/formatWalletAmount'
import { useWallet, type ActiveWallet } from '../../wallet/walletContext'
import './SessionChrome.css'

function SpadeMark() {
  return (
    <svg className="session-header__spade" viewBox="0 0 32 32" aria-hidden>
      <path
        fill="currentColor"
        d="M16 4c-2.5 3.2-6.2 5.4-8.8 8.2-1.4 1.5-2.2 3.4-2 5.5.2 2.8 2.4 5 5.1 5.4 1.8.2 3.5-.4 4.7-1.6v6.5h2V21.5c1.3 1.2 3 1.8 4.8 1.6 2.7-.4 4.9-2.6 5.1-5.4.2-2.1-.6-4-2-5.5C22.2 9.4 18.5 7.2 16 4z"
      />
    </svg>
  )
}

export function SessionHeader() {
  const { user } = useAuth()
  const { activeWallet, setActiveWallet } = useWallet()
  const { label, amount } = getWalletDisplay(user ?? undefined, activeWallet)

  const initial =
    (user?.displayName?.trim()?.[0] ?? user?.id?.[0] ?? '?').toUpperCase()

  function setWallet(w: ActiveWallet) {
    setActiveWallet(w)
  }

  return (
    <header className="session-header">
      <div className="session-header__inner">
        <div className="session-header__left">
          <SpadeMark />
          <div className="session-header__avatar" aria-hidden>
            {initial}
          </div>
        </div>
        <div className="session-header__center">
          <div className="session-header__pill" title="Wallet balance">
            <span className="session-header__pill-label">{label}</span>
            <span className="session-header__pill-amount">{amount}</span>
            <Link to="/shop" className="session-header__pill-plus" aria-label="開啟商店加值">
              +
            </Link>
          </div>
        </div>
        <div className="session-header__wallet-toggle" role="group" aria-label="錢包切換">
          <button
            type="button"
            className={
              'session-header__wallet-btn' + (activeWallet === 'GC' ? ' is-active' : '')
            }
            data-wallet="GC"
            onClick={() => setWallet('GC')}
          >
            GC
          </button>
          <button
            type="button"
            className={
              'session-header__wallet-btn' + (activeWallet === 'SC' ? ' is-active' : '')
            }
            data-wallet="SC"
            onClick={() => setWallet('SC')}
          >
            SC
          </button>
        </div>
      </div>
    </header>
  )
}
