import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './AppShell.css'

type NavItem = { to: string; label: string; end?: boolean }

const nav: readonly NavItem[] = [
  { to: '/', label: '大廳', end: true },
  { to: '/events', label: '活動' },
  { to: '/profile', label: '我的' },
]

function formatHeaderBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return null
  const u = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n)
  return currency ? `${u} ${currency}` : u
}

export function AppShell() {
  const { user, logout } = useAuth()
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner page-container">
          <div className="app-brand">
            <img
              className="app-brand__logo"
              src="/brand-logo.webp"
              alt=""
              width={40}
              height={40}
              decoding="async"
            />
            <span className="app-brand__title">Wynoco</span>
          </div>
          <div className="app-header__end">
            <div className="app-header__user" aria-label="帳戶">
              {user ? (
                <>
                  <span className="app-header__nick">{user.displayName ?? user.id}</span>
                  {formatHeaderBalance(user.balance, user.currency) ? (
                    <span className="app-header__balance" title="餘額">
                      {formatHeaderBalance(user.balance, user.currency)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="app-header__logout"
                    onClick={() => logout()}
                  >
                    登出
                  </button>
                </>
              ) : null}
            </div>
            <nav className="app-nav app-nav--desktop" aria-label="主要導覽">
              <ul className="app-nav__list">
                {nav.map(({ to, label, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        'app-nav__link' + (isActive ? ' is-active' : '')
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="app-main page-container">
        <Outlet />
      </main>

      <nav className="app-tabbar" aria-label="底部導覽">
        <ul className="app-tabbar__list">
          {nav.map(({ to, label, end }) => (
            <li key={to} className="app-tabbar__item">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  'app-tabbar__link' + (isActive ? ' is-active' : '')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
