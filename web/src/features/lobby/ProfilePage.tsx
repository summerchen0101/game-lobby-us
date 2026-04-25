import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Copy, Crown, Info, Volume2 } from "lucide-react";
import { HiPencil } from "react-icons/hi2";
import { useAuth } from "../../auth/useAuth";
import "./ProfilePage.css";
import "./SessionPageDecor.css";

const SOUND_KEY = "wynoco_profile_sound_on";
const RANK_MAX = 500;
/** Placeholder until rank API exists */
const RANK_PCT = 0;

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [soundOn, setSoundOn] = useState(true);
  const [uidCopied, setUidCopied] = useState(false);
  const fundsRef = useRef<HTMLDialogElement>(null);
  const uidCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundLabelId = useId();

  const rankCurrent = Math.round((RANK_PCT / 100) * RANK_MAX);

  const onRefresh = useCallback(async () => {
    try {
      await refreshUser();
    } catch {
      /* ignore */
    }
  }, [refreshUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(SOUND_KEY);
    if (v === "0") {
      setSoundOn(false);
    } else if (v === "1") {
      setSoundOn(true);
    }
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        onRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [onRefresh]);

  useEffect(() => {
    return () => {
      if (uidCopyTimeoutRef.current) {
        clearTimeout(uidCopyTimeoutRef.current);
      }
    };
  }, []);

  const copyUid = useCallback(() => {
    const id = user?.id;
    if (!id) return;
    void navigator.clipboard
      .writeText(id)
      .then(() => {
        setUidCopied(true);
        if (uidCopyTimeoutRef.current) {
          clearTimeout(uidCopyTimeoutRef.current);
        }
        uidCopyTimeoutRef.current = setTimeout(() => {
          setUidCopied(false);
          uidCopyTimeoutRef.current = null;
        }, 2000);
      })
      .catch(() => {
        /* ignore unsupported / denied */
      });
  }, [user?.id]);

  const initial = (
    user?.displayName?.trim()?.[0] ??
    user?.id?.[0] ??
    "?"
  ).toUpperCase();

  const displayHandle = user?.displayName?.trim() || user?.id?.trim() || "—";

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function onMyProfile() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSupport() {
    window.location.href =
      "mailto:support@example.com?subject=Support%20request";
  }

  function openFunds() {
    fundsRef.current?.showModal();
  }

  function closeFunds() {
    fundsRef.current?.close();
  }

  return (
    <section
      className="profile-page page-container session-page session-page--pattern"
      aria-labelledby="profile-heading">
      <h1 id="profile-heading" className="profile-page__sr-only">
        Profile
      </h1>
      <div className="profile-page__card">
        <div className="profile-page__hero">
          <div className="profile-page__avatar-stack">
            <div className="profile-page__avatar" aria-hidden>
              {initial}
              <button
                type="button"
                className="profile-page__edit"
                title="Edit (preview)"
                aria-label="Edit (preview)"
                tabIndex={-1}>
                <HiPencil
                  className="profile-page__edit-icon"
                  aria-hidden
                  size={15}
                />
              </button>
            </div>
          </div>
          <p className="profile-page__display-name">{displayHandle}</p>
          <div className="profile-page__uid-inline">
            <span className="profile-page__uid-muted">
              <span className="profile-page__uid-prefix">UID:</span>
              {user?.id ?? "—"}
            </span>
            <button
              type="button"
              className="profile-page__copy profile-page__copy--icon"
              onClick={copyUid}
              disabled={!user?.id}
              aria-label="Copy UID"
              title="Copy UID">
              <Copy size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          {uidCopied ? (
            <p className="profile-page__copy-toast" role="status">
              Copied
            </p>
          ) : null}
          <div className="profile-page__level-row">
            <span className="profile-page__level-label">Entry level</span>
            <button
              type="button"
              className="profile-page__info-btn"
              title="Level details will be available when your account is connected to the loyalty system."
              aria-label="Level info">
              <Info size={18} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
        <div className="profile-page__progress">
          <div className="profile-page__bar-row">
            <div
              className="profile-page__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={RANK_MAX}
              aria-valuenow={rankCurrent}
              aria-label="Level progress">
              <div
                className="profile-page__bar-fill"
                style={{ width: `${RANK_PCT}%` }}
              />
              <span className="profile-page__bar-label">
                {rankCurrent}/{RANK_MAX}
              </span>
              <div className="profile-page__bar-cap" aria-hidden>
                <Crown size={14} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="profile-page__settings">
          <div className="profile-page__setting-row">
            <span className="profile-page__setting-label" id={soundLabelId}>
              <Volume2
                className="profile-page__setting-icon"
                size={18}
                strokeWidth={2}
                aria-hidden
              />
              Sound
            </span>
            <button
              type="button"
              className="profile-page__switch"
              role="switch"
              aria-checked={soundOn}
              aria-labelledby={soundLabelId}
              onClick={toggleSound}>
              <span className="profile-page__switch-thumb" />
            </button>
          </div>
        </div>

        <div className="profile-page__btns">
          <button
            type="button"
            className="profile-page__btn-pill"
            onClick={onMyProfile}>
            MY PROFILE
          </button>
          <button
            type="button"
            className="profile-page__btn-pill"
            onClick={onSupport}>
            SUPPORT
          </button>
          <button
            type="button"
            className="profile-page__btn-pill"
            onClick={openFunds}>
            FUNDS HISTORY
          </button>
          <button
            type="button"
            className="profile-page__btn-pill"
            onClick={() => logout()}>
            SIGN OUT
          </button>
        </div>

        <a className="profile-page__privacy" href="#privacy">
          Privacy Policy
        </a>
      </div>

      <dialog
        ref={fundsRef}
        className="profile-page__dialog"
        onClose={closeFunds}
        aria-labelledby="funds-title">
        <h2 id="funds-title" className="profile-page__dialog-title">
          Funds history
        </h2>
        <p className="profile-page__dialog-text">
          Transaction history will appear here when connected to the backend.
        </p>
        <button
          type="button"
          className="btn-crown-primary profile-page__dialog-close"
          onClick={closeFunds}>
          OK
        </button>
      </dialog>
    </section>
  );
}
