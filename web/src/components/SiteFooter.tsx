import { CrownLogo } from './CrownLogo'
import './SiteFooter.css'

const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: '#terms', label: 'Terms of Service' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#responsible', label: 'Responsible gaming' },
  { href: '#help', label: 'Help center' },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="site-footer__brand">
          <CrownLogo width={56} aria-hidden />
          <span className="site-footer__brand-text">Wynoco</span>
        </div>

        <div className="site-footer__top">
          <div className="site-footer__top-texts">
            <p className="site-footer__top-text">
              We care about safe, responsible play. Please game in moderation and read our
              policies.
            </p>
            <p className="site-footer__top-text">
              For more, see responsible gaming and the help center.
            </p>
          </div>
          <div className="site-footer__top-actions">
            <a href="#responsible" className="btn-crown-secondary">
              Responsible gaming
            </a>
            <span className="site-footer__age" aria-label="Age restriction">
              18+
            </span>
          </div>
        </div>

        <div className="site-footer__grid">
          <p className="site-footer__para">
            Promotions and content shown here are for demonstration. Official rules always apply. Do
            not republish without permission.
          </p>
          <nav className="site-footer__nav" aria-label="Footer links">
            {FOOTER_LINKS.map(({ href, label }) => (
              <a key={href} className="site-footer__link" href={href}>
                {label}
              </a>
            ))}
          </nav>
          <p className="site-footer__para">
            The Wynoco lobby is a game entry point. Purchases and game content are provided by
            partners under their own terms.
          </p>
        </div>
      </div>
    </footer>
  )
}
