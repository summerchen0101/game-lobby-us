import { CrownLogo } from './CrownLogo'
import './SiteFooter.css'

const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: '#terms', label: '服務條款' },
  { href: '#privacy', label: '隱私權' },
  { href: '#responsible', label: '理性遊戲' },
  { href: '#help', label: '客服中心' },
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
              我們重視理性娛樂與使用者安全。請適度遊戲，並詳閱相關說明。
            </p>
            <p className="site-footer__top-text">更多資訊請見理性遊戲與幫助中心。</p>
          </div>
          <div className="site-footer__top-actions">
            <a href="#responsible" className="btn-crown-secondary">
              理性遊戲
            </a>
            <span className="site-footer__age" aria-label="年齡限制">
              18+
            </span>
          </div>
        </div>

        <div className="site-footer__grid">
          <p className="site-footer__para">
            本平台展示之促銷與內容僅供示意。實際規則以官方公告為準。未經授權請勿轉載。
          </p>
          <nav className="site-footer__nav" aria-label="頁尾連結">
            {FOOTER_LINKS.map(({ href, label }) => (
              <a key={href} className="site-footer__link" href={href}>
                {label}
              </a>
            ))}
          </nav>
          <p className="site-footer__para">
            Wynoco 大廳為遊戲入口整合介面。金流與遊戲內容由各合作方依其條款提供。
          </p>
        </div>
      </div>
    </footer>
  )
}
