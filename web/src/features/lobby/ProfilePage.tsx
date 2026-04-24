import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Crown, Info, Send, Volume2 } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { useGameShell } from "../../components/useGameShell";
import { ApiError } from "../../lib/api/client";
import { fetchDepositUrl } from "../../lib/api/wallet";
import { mockBumpBalance } from "../../lib/api/mock";
import { isMockMode } from "../../lib/env";
import "./ProfilePage.css";
import "./SessionPageDecor.css";

const SOUND_KEY = "wynoco_profile_sound_on";
const LOCATION_KEY = "wynoco_profile_location_on";
const RANK_MAX = 500;
/** Placeholder until rank API exists */
const RANK_PCT = 0;

function formatBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return "—";
  const u = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    n,
  );
  return currency ? `${u} ${currency}` : u;
}

export function ProfilePage() {
  const { user, token, refreshUser, logout } = useAuth();
  const { open: openShell } = useGameShell();
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [locationOn, setLocationOn] = useState(false);
  const fundsRef = useRef<HTMLDialogElement>(null);
  const liveId = useId();
  const locationLabelId = useId();
  const soundLabelId = useId();

  const rankCurrent = Math.round((RANK_PCT / 100) * RANK_MAX);

  const onRefresh = useCallback(async () => {
    setError(null);
    try {
      await refreshUser();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not refresh";
      setError(msg);
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
    const loc = window.localStorage.getItem(LOCATION_KEY);
    if (loc === "1") {
      setLocationOn(true);
    } else if (loc === "0") {
      setLocationOn(false);
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

  const initial = (
    user?.displayName?.trim()?.[0] ??
    user?.id?.[0] ??
    "?"
  ).toUpperCase();

  const displayHandle = user?.displayName?.trim() || user?.id?.trim() || "—";

  async function onDeposit() {
    if (!token) return;
    setError(null);
    setDepositing(true);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const res = await fetchDepositUrl(token, returnUrl);
      openShell({
        url: res.url,
        isPayment: true,
        openInNewWindow: res.openInNewWindow,
      });
      if (isMockMode()) {
        mockBumpBalance();
        await refreshUser();
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not open add funds";
      setError(msg);
    } finally {
      setDepositing(false);
    }
  }

  async function copyUid() {
    if (!user?.id) return;
    setCopyMsg(null);
    try {
      await navigator.clipboard.writeText(user.id);
      setCopyMsg("Copied");
    } catch {
      setCopyMsg("Could not copy—select the ID manually");
    }
    window.setTimeout(() => setCopyMsg(null), 2500);
  }

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

  function toggleLocation() {
    setLocationOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(LOCATION_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            /* preference only; no UI yet */
          },
          () => {
            /* denied — keep toggle state; user can turn off */
          },
          { maximumAge: 60_000, timeout: 10_000 },
        );
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
            <Crown
              className="profile-page__crown-above"
              size={22}
              strokeWidth={2}
              aria-hidden
            />
            <div className="profile-page__avatar" aria-hidden>
              {initial}
              <button
                type="button"
                className="profile-page__edit"
                title="Edit (preview)"
                aria-label="Edit (preview)"
                tabIndex={-1}>
                ✎
              </button>
            </div>
          </div>
          <p className="profile-page__display-name">{displayHandle}</p>
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
          {/* <div className="profile-page__uid-inline">
            <span className="profile-page__uid-muted">
              UID {user?.id ?? "—"}
            </span>
            <button
              type="button"
              className="profile-page__copy profile-page__copy--compact"
              onClick={() => {
                void copyUid();
              }}
              disabled={!user?.id}>
              Copy
            </button>
          </div> */}
        </div>
        {copyMsg ? (
          <p
            className="profile-page__copy-toast"
            id={liveId}
            role="status"
            aria-live="polite">
            {copyMsg}
          </p>
        ) : null}

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
            <span className="profile-page__setting-label" id={locationLabelId}>
              <Send
                className="profile-page__setting-icon"
                size={18}
                strokeWidth={2}
                aria-hidden
              />
              Location
            </span>
            <button
              type="button"
              className="profile-page__switch"
              role="switch"
              aria-checked={locationOn}
              aria-labelledby={locationLabelId}
              onClick={toggleLocation}>
              <span className="profile-page__switch-thumb" />
            </button>
          </div>
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

        <div className="profile-page__wallet">
          <p className="profile-page__wallet-title">Wallet</p>
          <p
            className="profile-page__uid profile-page__wallet-balance"
            style={{ margin: 0, fontSize: "0.88rem" }}>
            Balance:{" "}
            <strong style={{ color: "var(--crown-gold, #e6c040)" }}>
              {formatBalance(user?.balance, user?.currency)}
            </strong>
          </p>
          {error ? <p className="profile-page__error">{error}</p> : null}
          <div className="profile-page__wallet-row">
            <button
              type="button"
              className="btn-crown-primary profile-page__btn-block"
              onClick={() => onDeposit()}
              disabled={depositing}>
              {depositing ? "Preparing…" : "Add funds"}
            </button>
            <button
              type="button"
              className="btn-crown-ghost profile-page__btn-block"
              onClick={onRefresh}>
              Refresh balance
            </button>
          </div>
        </div>

        <a className="profile-page__privacy" href="#privacy">
          Privacy Policy
        </a>

        <p className="profile-page__hint">
          When you return from checkout or another page, we try to refresh your
          balance. If the amount looks stale, tap &quot;Refresh balance&quot;
          manually.
        </p>
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
