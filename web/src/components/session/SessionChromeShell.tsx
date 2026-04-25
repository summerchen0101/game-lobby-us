import type { ReactNode } from 'react'
import { SessionFooter } from './SessionFooter'
import { SessionHeader } from './SessionHeader'
import { SupportFab } from './SupportFab'
import './SessionChrome.css'

type SessionChromeShellProps = {
  children: ReactNode
  /** 大廳專用：header 疊在頂圖上，內嵌頁勿開 */
  headerOverHero?: boolean
}

export function SessionChromeShell({ children, headerOverHero = false }: SessionChromeShellProps) {
  return (
    <div
      className={
        'session-layout' + (headerOverHero ? ' session-layout--hero-overlay' : '')
      }
    >
      <SessionHeader />
      <div className="session-layout__main">{children}</div>
      <SessionFooter />
      <SupportFab />
    </div>
  )
}
