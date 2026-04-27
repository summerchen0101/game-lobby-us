import { Outlet } from 'react-router-dom'
import { SessionChromeShell } from './SessionChromeShell'

export function SessionLayout() {
  return (
    <SessionChromeShell>
      <Outlet />
    </SessionChromeShell>
  )
}
