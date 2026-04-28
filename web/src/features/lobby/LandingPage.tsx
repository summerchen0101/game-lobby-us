import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
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
import { ForgotPasswordModal } from "../auth/ForgotPasswordModal";
import { LoginModal } from "../auth/LoginModal";
import { PhoneVerificationModal } from "../auth/PhoneVerificationModal";
import { RegisterModal } from "../auth/RegisterModal";
import { TermsGateModal } from "../auth/TermsGateModal";
import {
  trustpilotBusinessUnitId,
  unityWebEntryDefaultGameId,
  isSlotWebEntryEnabled,
  isMockMode,
  isWsLobbyGamesEnabled,
} from "../../lib/env";
import * as apiMock from "../../lib/api/mock";
import { GATEWAY_API_GET_THIRD_PARTY_GAME_INFO } from "../../realtime/gatewayApi";
import {
  decodeGetThirdPartyGameInfoResponseBytes,
  encodeGetThirdPartyGameInfoRequest,
} from "../../realtime/playerAvatarWire";
import {
  type LobbyGameSortMenu,
  lobbyThirdPartyListToApiGames,
  sortLobbyGamesByMenu,
} from "../../realtime/lobbyDecode";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import {
  activeWalletToSlotMode,
  amountForActiveWallet,
  buildSlotLaunchUrl,
} from "../../lib/slotLaunchUrl";
import type { Game } from "../../lib/api/types";
import { useWallet } from "../../wallet/walletContext";
import {
  FLOATING_CTA_IMAGE,
  GUEST_DEMO_GAMES,
  GUEST_DEMO_ROW_GAMES,
  GUEST_DEMO_SLOT_IDS,
  GUEST_TOP_GAMES,
  getGuestHeroImage,
  lobbyGameCardThumbnail,
  getSessionLobbyBannerImage,
  LOBBY_DEMO_JACKPOT_AMOUNTS,
  UNITY_DEMO_LOBBY_GAME,
  unityDemoGameUrl,
} from "./landingContent";
import { LobbyGameSearchModal } from "./LobbyGameSearchModal";
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

function filterHotGames(games: Game[]): Game[] {
  return games.filter((g) => (g.lobbyLabel ?? "").toUpperCase() === "HOT");
}

function pickGuestDemoRowGames(
  games: Game[],
  orderedIds: readonly [number, number, number],
): Game[] {
  return orderedIds.map((id) => {
    const sid = String(id);
    const found = games.find((g) => g.id === sid);
    if (found) return found;
    return {
      id: sid,
      title: `Game ${id}`,
      launchUrl: "",
    };
  });
}

function lobbySortMenuForTab(f: LobbyFilterTab): LobbyGameSortMenu {
  return f;
}

function gamesForFilter(displayGames: Game[], f: LobbyFilterTab): Game[] {
  if (f === "all") {
    return displayGames;
  }
  if (f === "hot") {
    const labelHot = displayGames.filter(
      (g) => (g.lobbyLabel ?? "").toUpperCase() === "HOT",
    );
    if (labelHot.length > 0) return labelHot;
    const h = displayGames.filter((g) =>
      /hot|jackpot|fire/i.test(`${g.title} ${g.subtitle ?? ""} ${g.id}`),
    );
    return h.length > 0 ? h : displayGames;
  }
  if (f === "slots") {
    const slots = displayGames.filter(
      (g) => (g.lobbyCategory ?? "").toUpperCase() === "SLOT",
    );
    return slots.length > 0 ? slots : displayGames;
  }
  return displayGames;
}

function LobbyGameCardThumb({
  thumb,
  title,
}: {
  thumb: string | undefined;
  title: string;
}) {
  const [imageFailed, setImageFailed] = useState(!thumb);

  useEffect(() => {
    setImageFailed(!thumb);
  }, [thumb]);

  const showFallback = !thumb || imageFailed;
  const bgStyle =
    thumb && !imageFailed ? { backgroundImage: `url("${thumb}")` } : undefined;

  return (
    <div className="lobby-game-card__thumb" style={bgStyle}>
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="lobby-game-card__thumb-probe"
          aria-hidden
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {showFallback ? (
        <span className="lobby-game-card__fallback">{title}</span>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  const { token, user, refreshUser } = useAuth();
  const { activeWallet } = useWallet();
  const { open: openShell } = useGameShell();
  const {
    lobbyGames,
    lobbyLoading,
    lobbyError,
    liveJackpotAmounts,
    lobbyGet,
    requestRef,
  } = useGatewayLobby();

  const wsLobbyEnabled = isWsLobbyGamesEnabled();
  const mockLobby = isMockMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mockGames, setMockGames] = useState<Game[]>([]);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [lobbyFilter, setLobbyFilter] = useState<LobbyFilterTab>("all");
  const [lobbySearch, setLobbySearch] = useState("");
  const [lobbySearchModalOpen, setLobbySearchModalOpen] = useState(false);
  const lobbyGameFilterRef = useRef<HTMLDivElement | null>(null);

  const loading =
    user && mockLobby
      ? mockLoading
      : user && wsLobbyEnabled
        ? lobbyLoading
        : false;
  const error =
    user && mockLobby ? mockError : user && wsLobbyEnabled ? lobbyError : null;
  const {
    termsOpen,
    loginOpen,
    registerOpen,
    forgotPasswordOpen,
    phoneVerifyOpen,
    phoneVerifyPayload,
    openTermsThen,
    openLoginDirect,
    openRegisterDirect,
    openForgotPasswordDirect,
    closeTerms,
    closeLogin,
    closeRegister,
    closeForgotPassword,
    closePhoneVerify,
    onTermsAccepted,
  } = useAuthModals();

  const tpId = trustpilotBusinessUnitId();
  const sessionHeroSrc = useMemo(
    () => getSessionLobbyBannerImage(activeWallet),
    [activeWallet],
  );
  const guestHeroSrc = getGuestHeroImage();

  const guestLobbyRows = useMemo(() => {
    if (lobbyGames !== null) {
      const hotFiltered = filterHotGames(lobbyGames);
      const top = sortLobbyGamesByMenu(
        hotFiltered.length > 0 ? hotFiltered : lobbyGames,
        "hot",
      );
      return {
        top,
        demo: pickGuestDemoRowGames(lobbyGames, GUEST_DEMO_SLOT_IDS),
      };
    }
    return { top: GUEST_TOP_GAMES, demo: GUEST_DEMO_ROW_GAMES };
  }, [lobbyGames]);

  const displayGames = useMemo(() => {
    if (user && mockLobby) {
      return [UNITY_DEMO_LOBBY_GAME, ...mockGames];
    }
    if (user && wsLobbyEnabled && lobbyGames !== null) {
      const sorted = sortLobbyGamesByMenu(lobbyGames, "all");
      return [UNITY_DEMO_LOBBY_GAME, ...sorted];
    }
    if (!user) {
      return GUEST_DEMO_GAMES;
    }
    return [UNITY_DEMO_LOBBY_GAME];
  }, [user, mockLobby, mockGames, wsLobbyEnabled, lobbyGames]);

  const searchFilteredGames = useMemo(() => {
    const q = lobbySearch.trim().toLowerCase();
    if (!q) return displayGames;
    return displayGames.filter((g) => {
      const hay =
        `${g.title} ${g.subtitle ?? ""} ${g.id} ${g.provider ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [displayGames, lobbySearch]);

  /** 第三方遊戲：`thirdPartyGameInfoList` 順序，僅依搜尋過濾（不重排）。 */
  const providerGamesFiltered = useMemo(() => {
    const list = lobbyThirdPartyListToApiGames(
      lobbyGet?.thirdPartyGameInfoList,
    );
    const q = lobbySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((g) => {
      const hay =
        `${g.title} ${g.subtitle ?? ""} ${g.id} ${g.provider ?? ""} ${g.thirdPartyLaunch?.gameUID ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [lobbyGet?.thirdPartyGameInfoList, lobbySearch]);

  /** 各分類一份列表（已登入分頁用） */
  const gamesByFilter = useMemo(() => {
    const out = {} as Record<LobbyFilterTab, Game[]>;
    const sessionProviders =
      user && wsLobbyEnabled && !mockLobby ? providerGamesFiltered : [];
    for (const f of LOBBY_FILTER_ORDER) {
      if (f === "providers") {
        out[f] = sessionProviders;
        continue;
      }
      const filtered = gamesForFilter(searchFilteredGames, f);
      out[f] = sortLobbyGamesByMenu(filtered, lobbySortMenuForTab(f));
    }
    return out;
  }, [
    searchFilteredGames,
    providerGamesFiltered,
    user,
    wsLobbyEnabled,
    mockLobby,
  ]);
  console.log("gamesByFilter", gamesByFilter);

  const launchThirdPartyGame = useCallback(
    async (card: Game) => {
      const tp = card.thirdPartyLaunch;
      if (!tp) return;
      const platform = tp.platform.trim();
      const gameUID = tp.gameUID.trim();
      const req = requestRef.current;
      if (!req || !platform || !gameUID) return;
      try {
        const data = encodeGetThirdPartyGameInfoRequest(platform, gameUID);
        const r = await req({
          type: GATEWAY_API_GET_THIRD_PARTY_GAME_INFO,
          data,
          debugLabel: "GetThirdPartyGameInfo",
        });
        if (
          String(r.code) === "200" &&
          r.data instanceof Uint8Array &&
          r.data.byteLength > 0
        ) {
          const decoded = decodeGetThirdPartyGameInfoResponseBytes(r.data);
          const url = decoded.thirdPartyGameInfo?.gameLaunchURL?.trim();
          if (url) {
            openShell({
              url,
              widthPercent: card.embedWidthPercent,
              heightPercent: card.embedHeightPercent,
              isPayment: false,
              openInNewWindow: card.openInNewWindow,
            });
          }
        }
      } catch (e) {
        console.warn("[gateway-ws] GetThirdPartyGameInfo failed", e);
      }
    },
    [requestRef, openShell],
  );

  useEffect(() => {
    if (!user) return;
    const filterEl = lobbyGameFilterRef.current;
    const tabEl = document.getElementById(`lobby-tab-${lobbyFilter}`);
    if (!filterEl || !tabEl) return;
    const filterRect = filterEl.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();
    const tabCenter =
      tabRect.left - filterRect.left + tabRect.width / 2 + filterEl.scrollLeft;
    const maxScroll = Math.max(0, filterEl.scrollWidth - filterEl.clientWidth);
    const targetScroll = tabCenter - filterEl.clientWidth / 2;
    const left = Math.max(0, Math.min(maxScroll, targetScroll));
    filterEl.scrollTo({ left, behavior: "smooth" });
  }, [user, lobbyFilter]);

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
    } else if (auth === "forgot") {
      openForgotPasswordDirect();
      const next = new URLSearchParams(searchParams);
      next.delete("auth");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openForgotPasswordDirect, openTermsThen]);

  useEffect(() => {
    if (!token) {
      setMockGames([]);
      setMockLoading(false);
      setMockError(null);
      return;
    }
    if (!mockLobby) {
      setMockGames([]);
      setMockLoading(false);
      setMockError(null);
      void refreshUser();
      return;
    }
    let cancelled = false;
    setMockError(null);
    setMockLoading(true);
    void (async () => {
      try {
        const res = await apiMock.mockGetGames();
        if (cancelled) return;
        setMockGames(res.items ?? []);
        await refreshUser();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not load games";
        setMockError(msg);
        setMockGames([]);
      } finally {
        if (!cancelled) setMockLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser, mockLobby]);

  useEffect(() => {
    const { documentElement, body } = document;
    if (user) {
      documentElement.classList.remove("guest-lobby-page");
      body.classList.remove("guest-lobby-page");
      documentElement.classList.add("session-lobby-page");
      body.classList.add("session-lobby-page");
    } else {
      documentElement.classList.remove("session-lobby-page");
      body.classList.remove("session-lobby-page");
      documentElement.classList.add("guest-lobby-page");
      body.classList.add("guest-lobby-page");
    }
    return () => {
      documentElement.classList.remove("guest-lobby-page");
      body.classList.remove("guest-lobby-page");
      documentElement.classList.remove("session-lobby-page");
      body.classList.remove("session-lobby-page");
    };
  }, [user]);

  function onPlayGame(g?: Game) {
    const card = g ?? UNITY_DEMO_LOBBY_GAME;
    if (card.thirdPartyLaunch) {
      void launchThirdPartyGame(card);
      return;
    }
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
    onCardAction?: (g: Game) => void,
  ) {
    const thumb = g.thirdPartyLaunch
      ? undefined
      : lobbyGameCardThumbnail(
          g.id,
          thumbBase + index,
          g.thumbnailUrl,
        );
    return (
      <button
        type="button"
        className={
          "lobby-game-card" +
          (showTextLabels ? "" : " lobby-game-card--thumb-only")
        }
        onClick={() => (onCardAction ? onCardAction(g) : onPlayGame(g))}
        aria-label={showTextLabels ? undefined : g.title}>
        <LobbyGameCardThumb thumb={thumb} title={g.title} />
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
    onCardAction?: (g: Game) => void,
  ) {
    return (
      <div className="lobby-games-scroller">
        <ul className="lobby-games-track" role="list">
          {games.map((g, index) => (
            <li key={g.id}>
              {gameCard(g, index, thumbOffset, showTextLabels, onCardAction)}
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
            {lobbyGames !== null ? (
              <>
                <span className="guest-landing__accent">HOT</span> GAMES
              </>
            ) : (
              <>
                TOP <span className="guest-landing__accent">FREE-TO-PLAY</span>{" "}
                CASINO STYLE GAMES
              </>
            )}
          </h2>
          {renderGameTrack(
            guestLobbyRows.top,
            0,
            false,
            lobbyGames !== null
              ? () => {
                  openTermsThen("register");
                }
              : undefined,
          )}
        </section>

        <section
          className="guest-landing__games-block guest-landing__games-block--demo-row page-container"
          aria-labelledby="guest-demo-games-heading">
          <h2
            id="guest-demo-games-heading"
            className="guest-landing__row-title guest-landing__row-title--demo">
            <span className="guest-landing__accent">DEMO</span> here
          </h2>
          {renderGameTrack(
            guestLobbyRows.demo,
            guestLobbyRows.top.length,
            false,
          )}
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
              amounts={liveJackpotAmounts ?? LOBBY_DEMO_JACKPOT_AMOUNTS}
              variant={liveJackpotAmounts ? "live" : "demo"}
            />
          </div>
        </section>

        <section
          className="lobby-games-section page-container"
          aria-label="Games">
          {user ? (
            <div className="lobby-games-toolbar">
              <div className="lobby-games-filter-strip">
                <button
                  type="button"
                  className="lobby-game-search-trigger"
                  aria-label="Search games"
                  onClick={() => setLobbySearchModalOpen(true)}>
                  <Search strokeWidth={2.25} aria-hidden />
                </button>
                <div
                  ref={lobbyGameFilterRef}
                  className="lobby-game-filter"
                  role="tablist"
                  aria-label="Game categories">
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
              </div>
            </div>
          ) : null}
          {error ? <p className="lobby-games-error">{error}</p> : null}
          {user && loading && displayGames.length === 0 && !error ? (
            <p className="lobby-games-hint">Loading…</p>
          ) : null}
          {user && !loading && !error && displayGames.length === 0 ? (
            <p className="lobby-games-hint">No games available yet.</p>
          ) : null}
          {user &&
          !loading &&
          !error &&
          displayGames.length > 0 &&
          gamesByFilter[lobbyFilter].length === 0 ? (
            <p className="lobby-games-hint">
              No games match your search or filter.
            </p>
          ) : null}
          {user ? (
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
        onForgotPassword={openForgotPasswordDirect}
        onSwitchRegister={() => {
          closeLogin();
          openRegisterDirect();
        }}
      />
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={closeForgotPassword}
        onSwitchToLogin={() => {
          closeForgotPassword();
          openLoginDirect();
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
        displayEmail={phoneVerifyPayload?.displayEmail ?? ""}
        pendingBody={phoneVerifyPayload?.body ?? null}
      />
      <LobbyGameSearchModal
        open={lobbySearchModalOpen}
        onClose={() => setLobbySearchModalOpen(false)}
        initialQuery={lobbySearch}
        onSubmit={(q) => setLobbySearch(q)}
      />
    </div>
  );
}
