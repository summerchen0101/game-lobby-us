import { Gift, Home, ShoppingCart, User, Wallet, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
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

export function SessionFooter() {
  return (
    <nav className="session-footer" aria-label="Main navigation">
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
    </nav>
  )
}
