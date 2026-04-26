import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './LandingHeader.css'

const BRAND_LOGO = '/images/brand/brand-logo.webp'

function formatHeaderBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return null
  const u = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return currency ? `${u} ${currency}` : u
}

type Props = {
  onJoinUs: () => void
  onLogin: () => void
  /** 疊在首屏 banner 上（未登入大廳） */
  overHero?: boolean
}

export function LandingHeader({ onJoinUs, onLogin, overHero = false }: Props) {
  const { user, logout } = useAuth()

  return (
    <header
      className={
        'landing-header' + (overHero ? ' landing-header--over-hero' : '')
      }
    >
      <div className="landing-header__inner page-container">
        <Link to="/" className="landing-header__brand">
          <img
            src={BRAND_LOGO}
            alt=""
            className="landing-header__mark"
            width={44}
            height={44}
            decoding="async"
          />
          <span className="landing-header__title">Wynoco</span>
        </Link>
        <div className="landing-header__end">
          {user ? (
            <div className="landing-header__user">
              {formatHeaderBalance(user.balance, user.currency) ? (
                <span className="landing-header__balance" title="Balance">
                  {formatHeaderBalance(user.balance, user.currency)}
                </span>
              ) : null}
              <span className="landing-header__nick">{user.displayName ?? user.id}</span>
              <Link to="/profile" className="landing-header__link-profile">
                Profile
              </Link>
              <button type="button" className="landing-header__logout" onClick={() => logout()}>
                Log out
              </button>
            </div>
          ) : (
            <div className="landing-header__auth-btns">
              <button type="button" className="landing-header__login" onClick={onLogin}>
                LOGIN
              </button>
              <button type="button" className="landing-header__join" onClick={onJoinUs}>
                JOIN US
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
