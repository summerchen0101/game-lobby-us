import { Link } from 'react-router-dom'
import { CrownLogo } from './CrownLogo'
import './MarketingTopBar.css'

type NavBtn = { to: string; label: string }

type Props = {
  primary: NavBtn
  secondary?: NavBtn
}

export function MarketingTopBar({ primary, secondary }: Props) {
  return (
    <header className="marketing-top-bar">
      <Link to="/login" className="marketing-top-bar__brand">
        <CrownLogo width={40} aria-hidden />
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
