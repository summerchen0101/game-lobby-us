import { Navigate } from 'react-router-dom'

/** 舊連結 /events 導向 PROMO tab */
export function EventsRedirect() {
  return <Navigate to="/promo" replace />
}
