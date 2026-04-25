import { supportChatUrl } from '../../lib/env'
import './SupportChatFab.css'

export type SupportFabProps = {
  /** Guest lobby: above sticky CTA. Session: above bottom nav. */
  placement?: 'session' | 'guest'
}

export function SupportFab({ placement = 'session' }: SupportFabProps) {
  return (
    <button
      type="button"
      className={
        'support-chat-fab' +
        (placement === 'guest' ? ' support-chat-fab--guest' : ' support-chat-fab--session')
      }
      aria-label="Chat support"
      onClick={() => {
        const u = supportChatUrl()
        if (u) window.open(u, '_blank', 'noopener,noreferrer')
      }}
    >
      <svg className="support-chat-fab__icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
        />
      </svg>
    </button>
  )
}
