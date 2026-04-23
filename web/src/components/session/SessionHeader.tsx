import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getWalletDisplay } from '../../wallet/formatWalletAmount'
import { useWallet } from '../../wallet/walletContext'
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

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

function formatTimeClock(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

export function SessionHeader() {
  const { user } = useAuth()
  const { activeWallet, setActiveWallet } = useWallet()
  const { label, amount } = getWalletDisplay(user ?? undefined, activeWallet)
  const [now, setNow] = useState(() => new Date())

  const initial =
    (user?.displayName?.trim()?.[0] ?? user?.id?.[0] ?? '?').toUpperCase()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  function toggleWallet() {
    setActiveWallet(activeWallet === 'GC' ? 'SC' : 'GC')
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
        <div className="session-header__right">
          <time
            className="session-header__clock"
            dateTime={now.toISOString()}
            aria-label="目前時間"
          >
            Time: {formatTimeClock(now)}
          </time>
          <button
            type="button"
            className="session-header__wallet-track"
            role="switch"
            aria-checked={activeWallet === 'SC'}
            aria-label="切換顯示金幣或兌獎幣"
            onClick={toggleWallet}
          >
            <span
              className={
                'session-header__wallet-thumb' +
                (activeWallet === 'SC' ? ' is-sc' : ' is-gc')
              }
            >
              {activeWallet}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
