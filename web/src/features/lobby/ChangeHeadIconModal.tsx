import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import type { HeadIconChoice } from "./profileAvatarChoices"
import { PROFILE_AVATARS } from "./profileAvatars"
import "./ChangeHeadIconModal.css"

type Props = {
  open: boolean
  onClose: () => void
  currentAvatarId: string
  onConfirm: (selectedId: string) => void
  /** 伺服器 ListPlayerAvatars；空則用本地 PROFILE_AVATARS */
  choices?: HeadIconChoice[] | null
}

export function ChangeHeadIconModal({
  open,
  onClose,
  currentAvatarId,
  onConfirm,
  choices,
}: Props) {
  const titleId = useId()
  const [draftId, setDraftId] = useState(currentAvatarId)

  const tiles = useMemo((): HeadIconChoice[] => {
    if (choices && choices.length > 0) {
      return choices
    }
    return PROFILE_AVATARS.map((a) => ({
      id: a.id,
      imageSrc: a.imageSrc,
    }))
  }, [choices])

  useEffect(() => {
    if (open) {
      const fallback = tiles[0]?.id ?? PROFILE_AVATARS[0]?.id ?? "1"
      const cur = currentAvatarId?.trim()
      const exists = cur && tiles.some((t) => t.id === cur && !t.disabled)
      setDraftId(exists ? cur! : fallback)
    }
  }, [open, currentAvatarId, tiles])

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
    const picked = tiles.find((t) => t.id === draftId)
    if (picked?.disabled) return
    onConfirm(draftId)
    onClose()
  }, [draftId, onConfirm, onClose, tiles])

  if (!open) return null

  return createPortal(
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="app-modal app-modal--col change-head-icon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <h2 id={titleId} className="app-modal__title">
            Change the head icon
          </h2>
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="change-head-icon-modal__body">
          <div className="change-head-icon-modal__grid">
            {tiles.map((a) => (
              <button
                key={a.id}
                type="button"
                className={
                  "change-head-icon-modal__tile" +
                  (draftId === a.id
                    ? " change-head-icon-modal__tile--selected"
                    : "") +
                  (a.disabled ? " change-head-icon-modal__tile--disabled" : "")
                }
                disabled={a.disabled}
                onClick={() => {
                  if (a.disabled) return
                  setDraftId(a.id)
                }}
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
