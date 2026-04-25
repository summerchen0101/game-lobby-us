import { useCallback, useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { PROFILE_AVATARS } from "./profileAvatars"
import "./ChangeHeadIconModal.css"

type Props = {
  open: boolean
  onClose: () => void
  currentAvatarId: string
  onConfirm: (selectedId: string) => void
}

export function ChangeHeadIconModal({
  open,
  onClose,
  currentAvatarId,
  onConfirm,
}: Props) {
  const titleId = useId()
  const [draftId, setDraftId] = useState(currentAvatarId)

  useEffect(() => {
    if (open) {
      setDraftId(
        currentAvatarId ||
          PROFILE_AVATARS[0]?.id ||
          "preset-1",
      )
    }
  }, [open, currentAvatarId])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onKey])

  const handleConfirm = useCallback(() => {
    onConfirm(draftId)
    onClose()
  }, [draftId, onConfirm, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="change-head-icon-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="change-head-icon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="change-head-icon-modal__header">
          <h2 id={titleId} className="change-head-icon-modal__title">
            Change the head icon
          </h2>
          <button
            type="button"
            className="change-head-icon-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="change-head-icon-modal__body">
          <div className="change-head-icon-modal__grid">
            {PROFILE_AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={
                  "change-head-icon-modal__tile" +
                  (draftId === a.id
                    ? " change-head-icon-modal__tile--selected"
                    : "")
                }
                onClick={() => setDraftId(a.id)}
                aria-pressed={draftId === a.id}
                aria-label={`Select portrait ${a.id}`}
              >
                <img
                  className="change-head-icon-modal__img"
                  src={a.imageSrc}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="change-head-icon-modal__footer">
          <button
            type="button"
            className="change-head-icon-modal__confirm"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
