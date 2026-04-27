import { useMemo } from 'react'
import { Gift, Home, ShoppingCart, User, Wallet, type LucideIcon } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../../wallet/walletContext'
import './SessionChrome.css'

type Item = { to: string; label: string; end?: boolean; icon: 'shop' | 'redeem' | 'lobby' | 'promo' | 'profile' }

const items: Item[] = [
  { to: '/shop', label: 'SHOP', icon: 'shop' },
  { to: '/redeem', label: 'REDEEM', icon: 'redeem' },
  { to: '/', label: 'LOBBY', end: true, icon: 'lobby' },
  { to: '/promo', label: 'PROMO', icon: 'promo' },
  { to: '/profile', label: 'PROFILE', icon: 'profile' },
]

const iconByName: Record<Item['icon'], LucideIcon> = {
  shop: ShoppingCart,
  redeem: Wallet,
  lobby: Home,
  promo: Gift,
  profile: User,
}

function useFooterActiveIndex(): number {
  const { pathname } = useLocation()
  return useMemo(() => {
    for (let i = 0; i < items.length; i += 1) {
      const { to, end } = items[i]
      const p = matchPath(
        { path: to, end: end ?? false, caseSensitive: true },
        pathname
      )
      if (p) return i
    }
    return -1
  }, [pathname])
}

export function SessionFooter() {
  const { activeWallet } = useWallet()
  const activeIndex = useFooterActiveIndex()
  return (
    <nav
      className="session-footer"
      data-active-wallet={activeWallet}
      data-footer-active-index={activeIndex}
      style={
        activeIndex >= 0
          ? { ['--session-footer-active-index' as string]: String(activeIndex) }
          : undefined
      }
      aria-label="Main navigation"
    >
      <ul className="session-footer__list">
        {items.map(({ to, label, end, icon }) => {
          const Icon = iconByName[icon]
          return (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  'session-footer__link' + (isActive ? ' is-active' : '')
                }
              >
                <Icon className="session-footer__icon" strokeWidth={2} aria-hidden />
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
      <div className="session-footer__slide-track" aria-hidden>
        <div className="session-footer__slide" />
      </div>
    </nav>
  )
}
