import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { LandingHeader } from "../../components/LandingHeader";
import { LobbyJackpotStrip } from "../../components/LobbyJackpotStrip";
import { SessionChromeShell } from "../../components/session/SessionChromeShell";
import { SupportFab } from "../../components/session/SupportFab";
import { LobbyComplianceFooter } from "../../components/LobbyComplianceFooter";
import { TrustpilotSection } from "../../components/TrustpilotSection";
import { useGameShell } from "../../components/useGameShell";
import { useAuthModals } from "../auth/authModalsContext";
import { LoginModal } from "../auth/LoginModal";
import { PhoneVerificationModal } from "../auth/PhoneVerificationModal";
import { RegisterModal } from "../auth/RegisterModal";
import { TermsGateModal } from "../auth/TermsGateModal";
import {
  getGatewayWsUrl,
  trustpilotBusinessUnitId,
  unityWebEntryDefaultGameId,
  isSlotWebEntryEnabled,
} from "../../lib/env";
import { useGatewayWs } from "../../realtime/useGatewayWs";
import {
  activeWalletToSlotMode,
  amountForActiveWallet,
  buildSlotLaunchUrl,
} from "../../lib/slotLaunchUrl";
import { ApiError } from "../../lib/api/client";
import { fetchGames } from "../../lib/api/games";
import type { Game } from "../../lib/api/types";
import { useWallet } from "../../wallet/walletContext";
import {
  FLOATING_CTA_IMAGE,
  GUEST_DEMO_GAMES,
  GUEST_DEMO_ROW_GAMES,
  GUEST_TOP_GAMES,
  gameEntryThumbnail,
  getGuestHeroImage,
  getSessionLobbyBannerImage,
  LOBBY_DEMO_JACKPOT_AMOUNTS,
  UNITY_DEMO_LOBBY_GAME,
  unityDemoGameUrl,
} from "./landingContent";
import "./LobbyPage.css";

type LobbyFilterTab = "all" | "hot" | "providers" | "slots";

const LOBBY_FILTER_TABS: { id: LobbyFilterTab; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "hot", label: "HOT" },
  { id: "providers", label: "PROVIDERS" },
  { id: "slots", label: "SLOTS" },
];

const LOBBY_FILTER_ORDER: LobbyFilterTab[] = LOBBY_FILTER_TABS.map((t) => t.id);

/** 已登入「ALL」分頁內小節順序（與分類 tab 名稱對應，不含 ALL） */
const LOBBY_ALL_SUBSECTIONS: Array<Exclude<LobbyFilterTab, "all">> = [
  "hot",
  "providers",
  "slots",
];

function slotGameIdFromCard(g: Game, fallback: number): number {
  const n = Number.parseInt(g.id, 10);
  if (Number.isFinite(n) && n > 0) return n;
  return fallback;
}

function gamesForFilter(displayGames: Game[], f: LobbyFilterTab): Game[] {
  if (f === "all") {
    return displayGames;
  }
  if (f === "hot") {
    const h = displayGames.filter((g) =>
      /hot|jackpot|fire/i.test(`${g.title} ${g.subtitle ?? ""} ${g.id}`),
    );
    return h.length > 0 ? h : displayGames;
  }
  if (f === "providers" || f === "slots") {
    return displayGames;
  }
  return displayGames;
}

function devGatewayWsProbeEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  return import.meta.env.VITE_DEV_GATEWAY_WS !== "false";
}

export function LandingPage() {
  const { token, user, refreshUser } = useAuth();
  const { activeWallet } = useWallet();
  const { open: openShell } = useGameShell();

  useGatewayWs({
    enabled: devGatewayWsProbeEnabled(),
    wsToken: token ?? "",
    onState: (s) => {
      console.info(
        "[gateway-ws][dev] state:",
        s,
        "url:",
        getGatewayWsUrl({ token: token ?? "" }),
      );
    },
    onResponse: (msg) => {
      console.info("[gateway-ws][dev] response:", msg);
    },
    onSocketError: (ev) => {
      console.warn("[gateway-ws][dev] WebSocket error:", ev);
    },
    onGatewayError: (msg) => {
      console.warn("[gateway-ws][dev] non-success code:", msg);
    },
  });
  const {
    termsOpen,
    loginOpen,
    registerOpen,
    phoneVerifyOpen,
    phoneVerifyPayload,
    openTermsThen,
    openLoginDirect,
    openRegisterDirect,
    closeTerms,
    closeLogin,
    closeRegister,
    closePhoneVerify,
    onTermsAccepted,
  } = useAuthModals();

  const [searchParams, setSearchParams] = useSearchParams();
  const [apiItems, setApiItems] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbyFilter, setLobbyFilter] = useState<LobbyFilterTab>("all");

  const tpId = trustpilotBusinessUnitId();
  const sessionHeroSrc = useMemo(
    () => getSessionLobbyBannerImage(activeWallet),
    [activeWallet],
  );
  const guestHeroSrc = getGuestHeroImage();

  const displayGames = useMemo(
    () => (token ? [UNITY_DEMO_LOBBY_GAME, ...apiItems] : GUEST_DEMO_GAMES),
    [token, apiItems],
  );

  /** 各分類一份列表（已登入分頁用） */
  const gamesByFilter = useMemo(() => {
    const out = {} as Record<LobbyFilterTab, Game[]>;
    for (const f of LOBBY_FILTER_ORDER) {
      out[f] = gamesForFilter(displayGames, f);
    }
    return out;
  }, [displayGames]);

  useEffect(() => {
    if (!token) return;
    const el = document.getElementById(`lobby-tab-${lobbyFilter}`);
    el?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [token, lobbyFilter]);

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login") {
      openTermsThen("login");
      const next = new URLSearchParams(searchParams);
      next.delete("auth");
      setSearchParams(next, { replace: true });
    } else if (auth === "register") {
      openTermsThen("register");
      const next = new URLSearchParams(searchParams);
      next.delete("auth");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openTermsThen]);

  useEffect(() => {
    if (!token) {
      setApiItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const res = await fetchGames(token);
        if (cancelled) return;
        setApiItems(res.items ?? []);
        await refreshUser();
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load games";
        setError(msg);
        setApiItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  useEffect(() => {
    const { documentElement, body } = document;
    if (user) {
      documentElement.classList.remove("guest-lobby-page");
      body.classList.remove("guest-lobby-page");
    } else {
      documentElement.classList.add("guest-lobby-page");
      body.classList.add("guest-lobby-page");
    }
    return () => {
      documentElement.classList.remove("guest-lobby-page");
      body.classList.remove("guest-lobby-page");
    };
  }, [user]);

  function onPlayGame(g?: Game) {
    const card = g ?? UNITY_DEMO_LOBBY_GAME;
    let url: string;
    if (isSlotWebEntryEnabled()) {
      const gameId = slotGameIdFromCard(card, unityWebEntryDefaultGameId());
      url = buildSlotLaunchUrl({
        gameId,
        mode: activeWalletToSlotMode(activeWallet),
        amount: amountForActiveWallet(user, activeWallet),
        vipLevel: user?.vipLevel ?? 0,
        token: token ?? undefined,
      });
    } else if (card.launchUrl?.trim()) {
      url = card.launchUrl.trim();
    } else {
      url = unityDemoGameUrl();
    }
    openShell({
      url,
      widthPercent: card.embedWidthPercent,
      heightPercent: card.embedHeightPercent,
      isPayment: false,
      openInNewWindow: card.openInNewWindow,
    });
  }

  function onGuestSignUp() {
    openTermsThen("register");
  }

  function gameCard(
    g: Game,
    index: number,
    thumbBase: number,
    showTextLabels = true,
  ) {
    const thumb = gameEntryThumbnail(thumbBase + index, g.thumbnailUrl);
    return (
      <button
        type="button"
        className={
          "lobby-game-card" +
          (showTextLabels ? "" : " lobby-game-card--thumb-only")
        }
        onClick={() => onPlayGame(g)}
        aria-label={showTextLabels ? undefined : g.title}>
        <div
          className="lobby-game-card__thumb"
          style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}>
          {!thumb ? (
            <span className="lobby-game-card__fallback">{g.title}</span>
          ) : null}
        </div>
        {showTextLabels ? (
          <>
            <span className="lobby-game-card__title">{g.title}</span>
            {g.subtitle ? (
              <span className="lobby-game-card__sub">{g.subtitle}</span>
            ) : null}
          </>
        ) : null}
      </button>
    );
  }

  function renderGameTrack(
    games: Game[],
    thumbOffset = 0,
    showTextLabels = true,
  ) {
    return (
      <div className="lobby-games-scroller">
        <ul className="lobby-games-track" role="list">
          {games.map((g, index) => (
            <li key={g.id}>
              {gameCard(g, index, thumbOffset, showTextLabels)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderGameGrid(games: Game[], thumbOffset = 0) {
    return (
      <ul className="lobby-games-grid" role="list">
        {games.map((g, index) => (
          <li key={g.id} className="lobby-games-grid__item">
            {gameCard(g, index, thumbOffset, false)}
          </li>
        ))}
      </ul>
    );
  }

  const guestLandingMain = (
    <>
      <main className="lobby-landing__main guest-landing__main">
        <section
          className="guest-landing__hero"
          aria-label="Promotional banner">
          <LandingHeader
            overHero
            onJoinUs={() => openTermsThen("register")}
            onLogin={() => openTermsThen("login")}
          />
          <div className="guest-landing__hero-art-wrap">
            <img
              className="guest-landing__hero-img"
              src={guestHeroSrc}
              alt=""
              width={1200}
              height={420}
              decoding="async"
            />
            <button
              type="button"
              className="guest-landing__claim-banner"
              onClick={() => openTermsThen("login")}>
              CLAIM WELCOME BONUS
            </button>
          </div>
        </section>

        <section
          className="guest-landing__games-block page-container"
          aria-labelledby="guest-top-games-heading">
          <h2 id="guest-top-games-heading" className="guest-landing__row-title">
            TOP <span className="guest-landing__accent">FREE-TO-PLAY</span>{" "}
            CASINO STYLE GAMES
          </h2>
          {renderGameTrack(GUEST_TOP_GAMES, 0, false)}
        </section>

        <section
          className="guest-landing__games-block guest-landing__games-block--demo-row page-container"
          aria-labelledby="guest-demo-games-heading">
          <h2
            id="guest-demo-games-heading"
            className="guest-landing__row-title guest-landing__row-title--demo">
            <span className="guest-landing__accent">DEMO</span> here
          </h2>
          {renderGameTrack(GUEST_DEMO_ROW_GAMES, GUEST_TOP_GAMES.length, false)}
        </section>

        <div className="guest-landing__signup-cta page-container">
          <button
            type="button"
            className="guest-landing__signup-wide"
            onClick={onGuestSignUp}>
            SIGN UP TO PLAY FOR FREE
          </button>
        </div>

        <LobbyComplianceFooter variant="guest" />
      </main>

      <div
        className="guest-landing__sticky-bar"
        role="region"
        aria-label="Sign up">
        <img
          className="guest-landing__sticky-gift"
          src={FLOATING_CTA_IMAGE}
          alt=""
          width={72}
          height={72}
          decoding="async"
        />
        <button
          type="button"
          className="guest-landing__sticky-btn"
          onClick={onGuestSignUp}>
          SIGN UP TO PLAY FOR FREE
        </button>
      </div>

      <SupportFab placement="guest" />
    </>
  );

  const sessionLandingMain = (
    <>
      <main className="lobby-landing__main">
        <section className="lobby-hero-banner" aria-label="Promotional banner">
          <div className="lobby-hero-banner__art-wrap">
            <img
              className="lobby-hero-banner__img"
              src={sessionHeroSrc}
              alt=""
              width={1200}
              height={420}
              decoding="async"
            />
            <LobbyJackpotStrip
              wallet={activeWallet}
              amounts={LOBBY_DEMO_JACKPOT_AMOUNTS}
            />
          </div>
        </section>

        <section
          className="lobby-games-section page-container"
          aria-label="Games">
          {token ? (
            <div
              className="lobby-game-filter"
              role="tablist"
              aria-label="Game categories (demo)">
              {LOBBY_FILTER_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  id={`lobby-tab-${id}`}
                  type="button"
                  className={
                    "lobby-game-filter__tab" +
                    (lobbyFilter === id ? " is-active" : "")
                  }
                  role="tab"
                  aria-selected={lobbyFilter === id}
                  aria-controls="lobby-games-panel"
                  tabIndex={lobbyFilter === id ? 0 : -1}
                  onClick={() => setLobbyFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          {error ? <p className="lobby-games-error">{error}</p> : null}
          {token && loading && displayGames.length === 0 && !error ? (
            <p className="lobby-games-hint">Loading…</p>
          ) : null}
          {token && !loading && !error && displayGames.length === 0 ? (
            <p className="lobby-games-hint">No games available yet.</p>
          ) : null}
          {token ? (
            <div
              id="lobby-games-panel"
              className="lobby-games-panel-host"
              role="tabpanel"
              aria-labelledby={`lobby-tab-${lobbyFilter}`}>
              <div key={lobbyFilter} className="lobby-games-panel-swap">
                {lobbyFilter === "all"
                  ? (() => {
                      let thumbBase = 0;
                      return LOBBY_ALL_SUBSECTIONS.map((subId) => {
                        const games = gamesByFilter[subId];
                        if (games.length === 0) return null;
                        const off = thumbBase;
                        thumbBase += games.length;
                        const subLabel =
                          LOBBY_FILTER_TABS.find((t) => t.id === subId)
                            ?.label ?? subId;
                        return (
                          <div key={subId} className="lobby-games-group">
                            <h3
                              className="lobby-games-group-title"
                              id={`lobby-group-${subId}`}>
                              {subLabel}
                            </h3>
                            {renderGameTrack(games, off, false)}
                          </div>
                        );
                      });
                    })()
                  : renderGameGrid(gamesByFilter[lobbyFilter], 0)}
              </div>
            </div>
          ) : null}
        </section>

        {tpId ? <TrustpilotSection businessUnitId={tpId} /> : null}

        <LobbyComplianceFooter variant="session" />
      </main>
    </>
  );

  return (
    <div
      className={
        "lobby-landing" +
        (user ? " lobby-landing--session" : " lobby-landing--guest")
      }>
      {user ? (
        <SessionChromeShell headerOverHero>
          {sessionLandingMain}
        </SessionChromeShell>
      ) : (
        guestLandingMain
      )}

      <TermsGateModal
        open={termsOpen}
        onClose={closeTerms}
        onAccept={onTermsAccepted}
      />
      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        onSwitchRegister={() => {
          closeLogin();
          openRegisterDirect();
        }}
      />
      <RegisterModal
        open={registerOpen}
        onClose={closeRegister}
        onSwitchLogin={() => {
          closeRegister();
          openLoginDirect();
        }}
      />
      <PhoneVerificationModal
        open={phoneVerifyOpen}
        onClose={closePhoneVerify}
        displayPhone={phoneVerifyPayload?.displayPhone ?? ""}
        pendingBody={phoneVerifyPayload?.body ?? null}
      />
    </div>
  );
}
