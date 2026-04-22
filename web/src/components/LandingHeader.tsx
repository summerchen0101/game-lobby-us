import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { CrownLogo } from './CrownLogo'
import './LandingHeader.css'

function formatHeaderBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return null
  const u = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n)
  return currency ? `${u} ${currency}` : u
}

type Props = {
  onJoinUs: () => void
  onLogin: () => void
}

export function LandingHeader({ onJoinUs, onLogin }: Props) {
  const { user, logout } = useAuth()

  return (
    <header className="landing-header">
      <div className="landing-header__inner page-container">
        <Link to="/" className="landing-header__brand">
          <CrownLogo className="landing-header__mark" width={44} aria-hidden />
          <span className="landing-header__title">Wynoco</span>
        </Link>
        <div className="landing-header__end">
          {user ? (
            <div className="landing-header__user">
              {formatHeaderBalance(user.balance, user.currency) ? (
                <span className="landing-header__balance" title="餘額">
                  {formatHeaderBalance(user.balance, user.currency)}
                </span>
              ) : null}
              <span className="landing-header__nick">{user.displayName ?? user.id}</span>
              <Link to="/profile" className="landing-header__link-profile">
                我的
              </Link>
              <button type="button" className="landing-header__logout" onClick={() => logout()}>
                登出
              </button>
            </div>
          ) : (
            <div className="landing-header__auth-btns">
              <button type="button" className="landing-header__join" onClick={onJoinUs}>
                JOIN US
              </button>
              <button type="button" className="landing-header__login" onClick={onLogin}>
                LOGIN
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
