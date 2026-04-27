import './LobbyComplianceFooter.css'

const LOGO_SRC = '/images/compliance/img_logo.png'
const AGE_SRC = '/images/compliance/icon_21UP.png'

const LINK_COL_A: { href: string; label: string }[] = [
  { href: '#terms', label: 'Terms of Service' },
  { href: '#sweeps', label: 'Sweeps Policy' },
  { href: '#invite', label: 'Invite Friends Terms of Use' },
  { href: '#help', label: 'Help Center' },
]

const LINK_COL_B: { href: string; label: string }[] = [
  { href: '#privacy', label: 'Privacy Policy' },
  { href: '#responsible', label: 'Responsible Social Play' },
  { href: '#contact', label: 'Contact US' },
]

const LEGAL_GUEST =
  'You are aware and understand that you are providing information to WYNOCO. The sole use of this information will be to manage this promotion. NO PURCHASE NECESSARY to participate in Sweepstakes. SWEEPSTAKES ARE VOID WHERE PROHIBITED BY LAW. For more information about sweepstakes rules, please refer to the Sweeps Policy. Copyright WYNOCO. All rights reserved.'

const LEGAL_SESSION =
  'You are aware and understand that you are providing information to WYNOCO. The sole use of this information will be to manage this promotion. SWEEPSTAKES ARE VOID WHERE PROHIBITED BY LAW. For more information about sweepstakes rules, please refer to the Sweeps Policy. Copyright WYNOCO. All rights reserved.'

export type LobbyComplianceFooterProps = {
  variant: 'guest' | 'session'
}

export function LobbyComplianceFooter({ variant }: LobbyComplianceFooterProps) {
  const showPurchaseHeadline = variant === 'guest'

  return (
    <footer className="lobby-comp">
      <div className="lobby-comp__inner page-container">
        {showPurchaseHeadline ? (
          <h2 className="lobby-comp__purchase-title">
            NO PURCHASE
            <br />
            NECESSARY!
          </h2>
        ) : null}

        <div className="lobby-comp__tagline-wrap">
          <div className="lobby-comp__tagline-row">
            <span className="lobby-comp__tagline-line" aria-hidden />
            <p className="lobby-comp__tagline">
              <span className="lobby-comp__tagline--green">IT&apos;S ALWAYS </span>
              <span className="lobby-comp__tagline--white">FREE </span>
              <span className="lobby-comp__tagline--green">TO PLAY</span>
            </p>
            <span className="lobby-comp__tagline-line" aria-hidden />
          </div>
          <div className="lobby-comp__tagline-underline" aria-hidden />
        </div>

        <img className="lobby-comp__logo" src={LOGO_SRC} alt="WYNOCO" width={351} height={77} decoding="async" />

        <p className="lobby-comp__rsp-text">
          Responsible gaming is a fundamental priority at WYNOCO. For more information, visit our
          Responsible Social Play page.
        </p>

        <a href="#responsible" className="lobby-comp__rsp-btn">
          RESPONSIBLE SOCIAL PLAY
        </a>

        <div className="lobby-comp__divider" aria-hidden />

        <img
          className="lobby-comp__age"
          src={AGE_SRC}
          alt="21 and older"
          width={64}
          height={64}
          decoding="async"
        />

        <p className="lobby-comp__legal">
          {variant === 'guest' ? LEGAL_GUEST : LEGAL_SESSION}
        </p>

        <nav className="lobby-comp__links" aria-label="Legal and policy links">
          <div className="lobby-comp__links-col">
            {LINK_COL_A.map(({ href, label }) => (
              <a key={href + label} className="lobby-comp__link" href={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="lobby-comp__links-col">
            {LINK_COL_B.map(({ href, label }) => (
              <a key={href + label} className="lobby-comp__link" href={href}>
                {label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  )
}
