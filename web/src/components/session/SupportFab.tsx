import { MessageCircle } from 'lucide-react'
import './SessionChrome.css'

export function SupportFab() {
  return (
    <button
      type="button"
      className="session-support-fab"
      aria-label="Support"
      onClick={() => {
        /* placeholder */
      }}
    >
      <MessageCircle strokeWidth={2} aria-hidden />
    </button>
  )
}
