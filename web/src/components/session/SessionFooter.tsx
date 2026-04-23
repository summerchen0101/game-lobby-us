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

function Icon({ name }: { name: Item['icon'] }) {
  const cls = 'session-footer__icon'
  switch (name) {
    case 'shop':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
          <path d="M3 4h2l1 12h12l2-8H7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'redeem':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 8v12M8 12h8" strokeLinecap="round" />
          <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      )
    case 'lobby':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
        </svg>
      )
    case 'promo':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18M12 6v14" strokeLinecap="round" />
        </svg>
      )
    case 'profile':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export function SessionFooter() {
  return (
    <nav className="session-footer" aria-label="主要導覽">
      <ul className="session-footer__list">
        {items.map(({ to, label, end, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                'session-footer__link' + (isActive ? ' is-active' : '')
              }
            >
              <Icon name={icon} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
