import { useCallback, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { Copy } from 'lucide-react'
import { InfoPopover } from '../../components/InfoPopover'
import { CURRENCY_ICON_GC, CURRENCY_ICON_SC } from '../../lib/currencyIcons'
import './InviteFriendsModal.css'

type Props = {
  open: boolean
  onClose: () => void
}

/** Placeholder until referral API; copy/share use this value */
function getReferralUrl() {
  if (typeof window === 'undefined') {
    return 'https://www.wncogames.com?referrercode=demo'
  }
  return `https://www.wncogames.com?referrercode=demo`
}

export function InviteFriendsModal({ open, onClose }: Props) {
  const friendsRegistered = 0
  const friendsQualified = 0
  const titleId = useId()

  const referralUrl = getReferralUrl()

  const copyUrl = useCallback(() => {
    void navigator.clipboard.writeText(referralUrl).catch(() => {
      /* unsupported / denied */
    })
  }, [referralUrl])

  const onInvite = useCallback(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      void navigator
        .share({ title: 'Join me', text: 'Play with my referral link', url: referralUrl })
        .catch(() => {
          copyUrl()
        })
      return
    }
    copyUrl()
  }, [copyUrl, referralUrl])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="invite-friends-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="invite-friends-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="invite-friends-modal__header">
          <InfoPopover
            align="start"
            panelClassName="invite-friends-modal__info-popover-wrap"
            content={
              <p className="invite-friends-modal__qualified invite-friends-modal__qualified--popover">
                *Friends qualify by signing up with your referral link, purchasing Crown Coin packages
                worth $14.90 int total and not with an exisition account with STI group. Promotion Terms
                Apply.
              </p>
            }
          >
            {(p, triggerRef) => (
              <button
                ref={triggerRef}
                {...p}
                className="invite-friends-modal__info"
                aria-label="What qualified means"
              >
                i
              </button>
            )}
          </InfoPopover>
          <h2 id={titleId} className="invite-friends-modal__title">
            INVITE FRIENDS
          </h2>
          <button
            type="button"
            className="invite-friends-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <hr className="invite-friends-modal__rule" />
        <div className="invite-friends-modal__body">
          <p className="invite-friends-modal__reward-head">Invite Friends and Get</p>
          <div className="invite-friends-modal__reward-row">
            <img className="invite-friends-modal__coin" src={CURRENCY_ICON_GC} alt="" width={22} height={22} />
            <span>400K +</span>
            <img className="invite-friends-modal__coin" src={CURRENCY_ICON_SC} alt="" width={22} height={22} />
            <span>20</span>
          </div>
          <p className="invite-friends-modal__reward-sub">For Each Friend that Qualified!</p>

          <div className="invite-friends-modal__stats" aria-live="polite">
            <span>Friends Registered : {friendsRegistered}</span>
            <span>Friends Qualified* : {friendsQualified}</span>
          </div>

          <p className="invite-friends-modal__link-label">Tap to copy your link</p>
          <div className="invite-friends-modal__link-row">
            <button
              type="button"
              className="invite-friends-modal__link-pill"
              onClick={copyUrl}
              aria-label="Copy referral link"
            >
              <span title={referralUrl}>{referralUrl}</span>
            </button>
            <button
              type="button"
              className="invite-friends-modal__copy"
              onClick={copyUrl}
              aria-label="Copy"
            >
              <Copy size={20} strokeWidth={2.25} aria-hidden />
            </button>
          </div>

          <div className="invite-friends-modal__actions">
            <button type="button" className="invite-friends-modal__btn-invite" onClick={onInvite}>
              INVITE
            </button>
            <button
              type="button"
              className="invite-friends-modal__btn-claim"
              onClick={() => {
                /* claim rewards: wire when API exists */
              }}
            >
              CLAIM REWARDS
            </button>
          </div>

          <p className="invite-friends-modal__foot">*Qualified: Click on the yellow info button</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
