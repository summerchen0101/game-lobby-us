import { Link } from 'react-router-dom'
import './MarketingTopBar.css'

const BRAND_LOGO = '/imgs/brand-logo.webp'

type NavBtn = { to: string; label: string }

type Props = {
  primary: NavBtn
  secondary?: NavBtn
}

export function MarketingTopBar({ primary, secondary }: Props) {
  return (
    <header className="marketing-top-bar">
      <Link to="/login" className="marketing-top-bar__brand">
        <img
          src={BRAND_LOGO}
          alt=""
          className="marketing-top-bar__mark"
          width={40}
          height={40}
          decoding="async"
        />
        <span className="marketing-top-bar__title">Wynoco</span>
      </Link>
      <div className="marketing-top-bar__actions">
        <Link to={primary.to} className="btn-crown-primary">
          {primary.label}
        </Link>
        {secondary ? (
          <Link to={secondary.to} className="btn-crown-secondary">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </header>
  )
}
