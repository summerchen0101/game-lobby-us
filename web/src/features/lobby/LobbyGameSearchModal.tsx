import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./LobbyGameSearchModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  initialQuery: string;
  onSubmit: (q: string) => void;
};

export function LobbyGameSearchModal({
  open,
  onClose,
  initialQuery,
  onSubmit,
}: Props) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initialQuery);

  useEffect(() => {
    if (!open) return;
    setDraft(initialQuery);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function apply() {
    onSubmit(draft.trim());
    onClose();
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    apply();
  }

  if (!open) return null;

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal app-modal--scroll-y lobby-game-search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}>
        <div className="app-modal__header">
          <h2 id={titleId} className="app-modal__title">
            Search games
          </h2>
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close">
            ×
          </button>
        </div>
        <hr className="app-modal__rule app-modal__rule--flush" />
        <form className="lobby-game-search-modal__body" onSubmit={onFormSubmit}>
          <label htmlFor={inputId} className="lobby-game-search-modal__label">
            Game name or keyword
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            className="lobby-game-search-modal__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search games"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="lobby-game-search-modal__submit">
            Submit
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
