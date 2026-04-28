import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Copy, Crown, Info, Volume2 } from "lucide-react";
import { HiPencil } from "react-icons/hi2";
import { useAlert } from "../../components/alert/alertContext";
import { InfoPopover } from "../../components/InfoPopover";
import { useAuth } from "../../auth/useAuth";
import { isMockMode, isWsLobbyGamesEnabled } from "../../lib/env";
import {
  GATEWAY_API_LIST_PLAYER_AVATARS,
  GATEWAY_API_UPDATE_PLAYER_AVATAR,
} from "../../realtime/gatewayApi";
import {
  decodeListPlayerAvatarsResponseBytes,
  encodeUpdatePlayerCurrentAvatarRequest,
} from "../../realtime/playerAvatarWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { ChangeHeadIconModal } from "./ChangeHeadIconModal";
import { MyProfileModal } from "./MyProfileModal";
import {
  effectiveAvatarId,
  getProfileAvatarById,
} from "./profileAvatars";
import {
  headIconChoicesFromServerRows,
  type HeadIconChoice,
} from "./profileAvatarChoices";
import { useProfileAvatarId } from "./profileAvatarStorage";
import "./ProfilePage.css";
import "./SessionPageDecor.css";

const SOUND_KEY = "wynoco_profile_sound_on";
const RANK_MAX = 500;
/** Placeholder until rank API exists */
const RANK_PCT = 0;

type ZendeskWindow = Window & { zE?: (a: string, b: string) => void };

export function ProfilePage() {
  const { show } = useAlert();
  const { user, mergeUser, refreshUser, logout } = useAuth();
  const { requestRef } = useGatewayLobby();
  const { avatarId, setAvatarId } = useProfileAvatarId();
  const [headIconOpen, setHeadIconOpen] = useState(false);
  const [headIconChoices, setHeadIconChoices] = useState<
    HeadIconChoice[] | null
  >(null);
  const [myProfileOpen, setMyProfileOpen] = useState(false);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const fundsRef = useRef<HTMLDialogElement>(null);
  const soundLabelId = useId();

  const betReq = user?.vipCurrentLevelBetExpRequired;
  const betExp = user?.vipCurrentLevelBetExp;
  const useServerVipBar = betReq !== undefined && betReq > 0;
  const rankMax = useServerVipBar ? betReq! : RANK_MAX;
  const rankCurrent = useServerVipBar
    ? Math.min(betReq!, Math.max(0, betExp ?? 0))
    : Math.round((RANK_PCT / 100) * RANK_MAX);
  const rankPct = useServerVipBar
    ? Math.min(100, Math.round(((betExp ?? 0) / betReq!) * 100))
    : RANK_PCT;

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

  const copyUid = useCallback(() => {
    const id = user?.id;
    if (!id) return;
    void navigator.clipboard
      .writeText(id)
      .then(() => {
        show("Copied", { variant: "success" });
      })
      .catch(() => {
        show("Could not copy", { variant: "error" });
      });
  }, [user?.id, show]);

  const initial = (
    user?.displayName?.trim()?.[0] ??
    user?.id?.[0] ??
    "?"
  ).toUpperCase();

  const displayAvatarId = effectiveAvatarId(user?.avatarId, avatarId);
  const pickedAvatar = getProfileAvatarById(displayAvatarId);
  const showAvatarImage = Boolean(
    pickedAvatar && !avatarImgFailed,
  );

  useEffect(() => {
    setAvatarImgFailed(false);
  }, [displayAvatarId]);

  useEffect(() => {
    if (!headIconOpen) return;
    setHeadIconChoices(null);
    if (isMockMode() || !isWsLobbyGamesEnabled()) return;
    const req = requestRef.current;
    if (!req) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await req({
          type: GATEWAY_API_LIST_PLAYER_AVATARS,
          data: new Uint8Array(0),
          debugLabel: "LIST_PLAYER_AVATARS",
        });
        if (cancelled) return;
        if (String(r.code) === "200" && r.data instanceof Uint8Array) {
          if (r.data.byteLength === 0) {
            setHeadIconChoices(null);
            return;
          }
          const { avatarsInfo } = decodeListPlayerAvatarsResponseBytes(r.data);
          const next = headIconChoicesFromServerRows(avatarsInfo);
          setHeadIconChoices(next.length > 0 ? next : null);
        }
      } catch {
        if (!cancelled) setHeadIconChoices(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [headIconOpen, requestRef]);

  const confirmHeadIcon = useCallback(
    async (selectedId: string) => {
      setAvatarId(selectedId);
      const n = Number.parseInt(selectedId, 10);
      if (!user || !Number.isFinite(n) || n < 1) return;
      const wsOk = !isMockMode() && isWsLobbyGamesEnabled();
      if (wsOk && requestRef.current) {
        try {
          const body = encodeUpdatePlayerCurrentAvatarRequest({
            avatarID: selectedId,
            avatarURL: "",
            isFBAvatar: false,
          });
          const r = await requestRef.current({
            type: GATEWAY_API_UPDATE_PLAYER_AVATAR,
            data: body,
            debugLabel: "UPDATE_PLAYER_AVATAR",
          });
          if (String(r.code) !== "200") {
            show("Could not update avatar", { variant: "error" });
            return;
          }
        } catch {
          show("Could not update avatar", { variant: "error" });
          return;
        }
      }
      mergeUser({ avatarId: n });
    },
    [mergeUser, requestRef, setAvatarId, show, user],
  );

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
    setMyProfileOpen(true);
  }

  function onSupport() {
    const zE = (window as ZendeskWindow).zE;
    if (typeof zE === "function") {
      try {
        zE("messenger", "open");
        return;
      } catch {
        /* fall through */
      }
    }
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
            <button
              type="button"
              className={
                "profile-page__avatar" +
                (showAvatarImage ? " profile-page__avatar--has-image" : "")
              }
              onClick={() => setHeadIconOpen(true)}
              aria-label="Change head icon"
              title="Change head icon">
              <span className="profile-page__avatar-media">
                {showAvatarImage && pickedAvatar ? (
                  <img
                    className="profile-page__avatar-img"
                    src={pickedAvatar.imageSrc}
                    alt=""
                    onError={() => setAvatarImgFailed(true)}
                  />
                ) : (
                  <span className="profile-page__avatar-initial">{initial}</span>
                )}
              </span>
              <span className="profile-page__edit" aria-hidden>
                <HiPencil className="profile-page__edit-icon" aria-hidden />
              </span>
            </button>
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
              <Copy
                className="profile-page__uid-copy-icon"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          </div>
          <div className="profile-page__level-row">
            <span className="profile-page__level-label">Entry level</span>
            <InfoPopover
              align="end"
              content={
                <p className="profile-page__info-popover-text">
                  {useServerVipBar
                    ? "VIP bet progress toward the next loyalty tier."
                    : "Level details will be available when your account is connected to the loyalty system."}
                </p>
              }>
              {(p, triggerRef) => (
                <button
                  ref={triggerRef}
                  {...p}
                  className="profile-page__info-btn"
                  aria-label="Level info">
                  <Info
                    className="profile-page__level-info-icon"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </button>
              )}
            </InfoPopover>
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
                style={{ width: `${rankPct}%` }}
              />
              <span className="profile-page__bar-label">
                {rankCurrent}/{rankMax}
              </span>
              <div className="profile-page__bar-cap" aria-hidden>
                <Crown
                  className="profile-page__bar-crown-icon"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="profile-page__settings">
          <div className="profile-page__setting-row">
            <span className="profile-page__setting-label" id={soundLabelId}>
              <Volume2
                className="profile-page__setting-icon"
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

      <MyProfileModal
        open={myProfileOpen}
        onClose={() => setMyProfileOpen(false)}
        userId={user?.id}
        displayName={user?.displayName}
        avatarId={displayAvatarId ?? ""}
        email={user?.email}
        phone={user?.phone}
      />

      <ChangeHeadIconModal
        open={headIconOpen}
        onClose={() => setHeadIconOpen(false)}
        currentAvatarId={displayAvatarId ?? "1"}
        onConfirm={confirmHeadIcon}
        choices={headIconChoices}
      />

      <dialog
        ref={fundsRef}
        className="profile-page__dialog"
        onClose={closeFunds}
        aria-labelledby="funds-title">
        <div className="app-modal__header">
          <h2 id="funds-title" className="app-modal__title">
            Funds history
          </h2>
          <button
            type="button"
            className="app-modal__close"
            onClick={closeFunds}
            aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal__body">
          <p className="profile-page__dialog-text">
            Transaction history will appear here when connected to the backend.
          </p>
          <button
            type="button"
            className="btn-crown-primary profile-page__dialog-close"
            onClick={closeFunds}>
            OK
          </button>
        </div>
      </dialog>
    </section>
  );
}
