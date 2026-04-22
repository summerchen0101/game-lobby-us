import { buildIframeAllow } from '../lib/gameShell'
import './GameShellContext.css'

type GameOverlayProps = {
  url: string
  widthPercent: number
  heightPercent: number
  isPayment: boolean
  onClose: () => void
}

export function GameOverlay({
  url,
  widthPercent,
  heightPercent,
  isPayment,
  onClose,
}: GameOverlayProps) {
  const allow = buildIframeAllow(isPayment)

  return (
    <div
      className="game-overlay"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'block',
      }}
    >
      <button
        type="button"
        className="game-overlay__close"
        onClick={onClose}
        aria-label="關閉"
      >
        <span className="game-overlay__close-text">關閉</span>
      </button>
      <iframe
        className="game-overlay__frame"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          border: '3px solid #fff',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
        title={isPayment ? 'payment' : 'game'}
        src={url}
        referrerPolicy="strict-origin-when-cross-origin"
        allow={allow}
      />
    </div>
  )
}
