import { Home } from 'lucide-react'
import { buildIframeAllow } from '../lib/gameShell'
import './GameShellContext.css'

type GameOverlayProps = {
  url: string
  widthPercent: number
  heightPercent: number
  isPayment: boolean
  onClose: () => void
}

export function GameOverlay({ url, isPayment, onClose }: GameOverlayProps) {
  const allow = buildIframeAllow(isPayment)

  return (
    <div className="game-overlay" role="presentation">
      <button
        type="button"
        className="game-overlay__close"
        onClick={onClose}
        aria-label="Return to lobby"
      >
        <Home
          className="game-overlay__close-icon"
          strokeWidth={2}
          aria-hidden
        />
      </button>
      <iframe
        className="game-overlay__frame"
        title={isPayment ? 'payment' : 'game'}
        src={url}
        referrerPolicy="strict-origin-when-cross-origin"
        allow={allow}
      />
    </div>
  )
}
