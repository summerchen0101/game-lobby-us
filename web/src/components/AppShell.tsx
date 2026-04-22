import { NavLink, Outlet } from 'react-router-dom'
import './AppShell.css'

type NavItem = { to: string; label: string; end?: boolean }

const nav: readonly NavItem[] = [
  { to: '/', label: '大廳', end: true },
  { to: '/events', label: '活動' },
  { to: '/profile', label: '我的' },
]

export function AppShell() {
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
