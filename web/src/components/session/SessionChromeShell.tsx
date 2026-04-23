import type { ReactNode } from 'react'
import { SessionFooter } from './SessionFooter'
import { SessionHeader } from './SessionHeader'
import { SupportFab } from './SupportFab'
import './SessionChrome.css'

export function SessionChromeShell({ children }: { children: ReactNode }) {
  return (
    <div className="session-layout">
      <SessionHeader />
      <div className="session-layout__main">{children}</div>
      <SessionFooter />
      <SupportFab />
    </div>
  )
}
