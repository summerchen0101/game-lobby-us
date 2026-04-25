import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getCurrencyIconUrl } from '../../lib/currencyIcons'
import { getWalletDisplay } from '../../wallet/formatWalletAmount'
import { useWallet } from '../../wallet/walletContext'
import './SessionChrome.css'

const BRAND_LOGO = '/imgs/brand-logo.webp'

export function SessionHeader() {
  const { user } = useAuth()
  const { activeWallet, setActiveWallet } = useWallet()
  const { label, amount } = getWalletDisplay(user ?? undefined, activeWallet)

  const initial =
    (user?.displayName?.trim()?.[0] ?? user?.id?.[0] ?? '?').toUpperCase()

  function toggleWallet() {
    setActiveWallet(activeWallet === 'GC' ? 'SC' : 'GC')
  }

  return (
    <header
      className="session-header"
      data-active-wallet={activeWallet}
    >
      <div className="session-header__inner">
        <div className="session-header__left">
          <img
            src={BRAND_LOGO}
            alt=""
            className="session-header__logo"
            width={32}
            height={32}
            decoding="async"
          />
          <div className="session-header__avatar" aria-hidden>
            {initial}
          </div>
        </div>
        <div className="session-header__center">
          <div className="session-header__pill" title="Wallet balance">
            <span className="session-header__pill-label">
              <img
                src={getCurrencyIconUrl(activeWallet)}
                alt=""
                className="session-header__pill-label-img"
                width={30}
                height={30}
              />
              <span className="session-header__pill-label-sr">{label}</span>
            </span>
            <span className="session-header__pill-amount">{amount}</span>
            <Link to="/shop" className="session-header__pill-plus" aria-label="Open shop to add coins">
              <Plus className="session-header__pill-plus-icon" size={20} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="session-header__right">
          <button
            type="button"
            className="session-header__wallet-track"
            role="switch"
            aria-checked={activeWallet === 'SC'}
            aria-label="Switch between gold coins and sweepstakes coins"
            onClick={toggleWallet}
          >
            <span
              className={
                'session-header__wallet-thumb' +
                (activeWallet === 'SC' ? ' is-sc' : ' is-gc')
              }
            >
              <img
                src={getCurrencyIconUrl(activeWallet)}
                alt=""
                className="session-header__wallet-thumb-img"
                width={20}
                height={20}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
