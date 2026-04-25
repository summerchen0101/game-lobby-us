import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { LandingHeader } from '../../components/LandingHeader'
import { LobbyJackpotStrip } from '../../components/LobbyJackpotStrip'
import { SessionChromeShell } from '../../components/session/SessionChromeShell'
import { LobbyComplianceFooter } from '../../components/LobbyComplianceFooter'
import { TrustpilotSection } from '../../components/TrustpilotSection'
import { useGameShell } from '../../components/useGameShell'
import { useAuthModals } from '../auth/authModalsContext'
import { LoginModal } from '../auth/LoginModal'
import { RegisterModal } from '../auth/RegisterModal'
import { TermsGateModal } from '../auth/TermsGateModal'
import { supportChatUrl, trustpilotBusinessUnitId } from '../../lib/env'
import { ApiError } from '../../lib/api/client'
import { fetchGames } from '../../lib/api/games'
import type { Game } from '../../lib/api/types'
import { useWallet } from '../../wallet/walletContext'
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
} from './landingContent'
import './LobbyPage.css'

type LobbyFilterTab = 'all' | 'hot' | 'providers' | 'slots'

const LOBBY_FILTER_TABS: { id: LobbyFilterTab; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'hot', label: 'HOT' },
  { id: 'providers', label: 'PROVIDERS' },
  { id: 'slots', label: 'SLOTS' },
]

const LOBBY_FILTER_ORDER: LobbyFilterTab[] = LOBBY_FILTER_TABS.map((t) => t.id)

function gamesForFilter(displayGames: Game[], f: LobbyFilterTab): Game[] {
  if (f === 'all') {
    return displayGames
  }
  if (f === 'hot') {
    const h = displayGames.filter((g) =>
      /hot|jackpot|fire/i.test(`${g.title} ${g.subtitle ?? ''} ${g.id}`),
    )
    return h.length > 0 ? h : displayGames
  }
  if (f === 'providers' || f === 'slots') {
    return displayGames
  }
  return displayGames
}

export function LandingPage() {
  const { token, user, refreshUser } = useAuth()
  const { activeWallet } = useWallet()
  const { open: openShell } = useGameShell()
  const {
    termsOpen,
    loginOpen,
    registerOpen,
    openTermsThen,
    openLoginDirect,
    openRegisterDirect,
    closeTerms,
    closeLogin,
    closeRegister,
    onTermsAccepted,
  } = useAuthModals()

  const [searchParams, setSearchParams] = useSearchParams()
  const [apiItems, setApiItems] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registerEmailForm, setRegisterEmailForm] = useState(false)
  const [lobbyFilter, setLobbyFilter] = useState<LobbyFilterTab>('all')
  const lobbyFilterRef = useRef(lobbyFilter)
  const panelsRef = useRef<HTMLDivElement | null>(null)
  const programmaticPanelScrollRef = useRef(false)
  const scrollRafRef = useRef<number | null>(null)

  const tpId = trustpilotBusinessUnitId()
  const sessionHeroSrc = useMemo(
    () => getSessionLobbyBannerImage(activeWallet),
    [activeWallet],
  )
  const guestHeroSrc = getGuestHeroImage()

  const displayGames = useMemo(
    () => (token ? [UNITY_DEMO_LOBBY_GAME, ...apiItems] : GUEST_DEMO_GAMES),
    [token, apiItems],
  )

  /** 各分類一份列表（已登入分頁用） */
  const gamesByFilter = useMemo(() => {
    const out = {} as Record<LobbyFilterTab, Game[]>
    for (const f of LOBBY_FILTER_ORDER) {
      out[f] = gamesForFilter(displayGames, f)
    }
    return out
  }, [displayGames])

  const scrollPanelsToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const el = panelsRef.current
      if (!el) return
      const w = el.clientWidth
      if (w === 0) return
      programmaticPanelScrollRef.current = behavior === 'smooth'
      const clamped = Math.max(0, Math.min(LOBBY_FILTER_ORDER.length - 1, index))
      el.scrollTo({ left: clamped * w, behavior })
      if (behavior === 'auto') {
        programmaticPanelScrollRef.current = false
      } else {
        window.setTimeout(() => {
          programmaticPanelScrollRef.current = false
        }, 450)
      }
    },
    [],
  )

  const onTabClick = useCallback(
    (id: LobbyFilterTab) => {
      const index = LOBBY_FILTER_ORDER.indexOf(id)
      if (index < 0) return
      setLobbyFilter(id)
      scrollPanelsToIndex(index, 'smooth')
    },
    [scrollPanelsToIndex],
  )

  const onPanelsScroll = useCallback(() => {
    if (programmaticPanelScrollRef.current) return
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current)
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const el = panelsRef.current
      if (!el) return
      const w = el.clientWidth
      if (w === 0) return
      const i = Math.round(el.scrollLeft / w)
      const id = LOBBY_FILTER_ORDER[Math.max(0, Math.min(LOBBY_FILTER_ORDER.length - 1, i))]
      if (id) {
        setLobbyFilter((prev) => (id !== prev ? id : prev))
      }
    })
  }, [])

  useEffect(() => {
    if (!token) return
    const el = panelsRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const i = LOBBY_FILTER_ORDER.indexOf(lobbyFilterRef.current)
      if (i < 0) return
      programmaticPanelScrollRef.current = true
      el.scrollLeft = i * el.clientWidth
      programmaticPanelScrollRef.current = false
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [token])

  useEffect(() => {
    if (!token) return
    const el = document.getElementById(`lobby-tab-${lobbyFilter}`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [token, lobbyFilter])

  useEffect(() => {
    const el = panelsRef.current
    if (!el) return
    const onEnd = () => {
      programmaticPanelScrollRef.current = false
    }
    el.addEventListener('scrollend', onEnd)
    return () => el.removeEventListener('scrollend', onEnd)
  }, [token])

  useEffect(() => {
    lobbyFilterRef.current = lobbyFilter
  }, [lobbyFilter])

  useEffect(() => {
    if (!registerOpen) setRegisterEmailForm(false)
  }, [registerOpen])

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login') {
      openTermsThen('login')
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
    } else if (auth === 'register') {
      openTermsThen('register')
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, openTermsThen])

  useEffect(() => {
    if (!token) {
      setApiItems([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setLoading(true)
    void (async () => {
      try {
        const res = await fetchGames(token)
        if (cancelled) return
        setApiItems(res.items ?? [])
        await refreshUser()
      } catch (e) {
        if (cancelled) return
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not load games'
        setError(msg)
        setApiItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, refreshUser])

  useEffect(() => {
    const { documentElement, body } = document
    if (user) {
      documentElement.classList.remove('guest-lobby-page')
      body.classList.remove('guest-lobby-page')
    } else {
      documentElement.classList.add('guest-lobby-page')
      body.classList.add('guest-lobby-page')
    }
    return () => {
      documentElement.classList.remove('guest-lobby-page')
      body.classList.remove('guest-lobby-page')
    }
  }, [user])

  function onPlayGame(g: Game) {
    if (g.launchUrl) {
      openShell({
        url: g.launchUrl,
        widthPercent: g.embedWidthPercent,
        heightPercent: g.embedHeightPercent,
        isPayment: false,
        openInNewWindow: g.openInNewWindow,
      })
      return
    }
    if (!token) {
      openTermsThen('login')
      return
    }
  }

  function onGuestSignUp() {
    openTermsThen('register')
  }

  function onGuestChatClick() {
    const u = supportChatUrl()
    if (u) window.open(u, '_blank', 'noopener,noreferrer')
  }

  function renderGameTrack(games: Game[], thumbOffset = 0) {
    return (
      <div className="lobby-games-scroller">
        <ul className="lobby-games-track" role="list">
          {games.map((g, index) => {
            const thumb = gameEntryThumbnail(thumbOffset + index, g.thumbnailUrl)
            return (
              <li key={g.id}>
                <button
                  type="button"
                  className="lobby-game-card"
                  onClick={() => onPlayGame(g)}
                  disabled={!!token && !g.launchUrl}
                >
                  <div
                    className="lobby-game-card__thumb"
                    style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}
                  >
                    {!thumb ? <span className="lobby-game-card__fallback">{g.title}</span> : null}
                  </div>
                  <span className="lobby-game-card__title">{g.title}</span>
                  {g.subtitle ? <span className="lobby-game-card__sub">{g.subtitle}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const guestLandingMain = (
    <>
      <main className="lobby-landing__main guest-landing__main">
        <section className="guest-landing__hero" aria-label="Promotional banner">
          <LandingHeader
            overHero
            onJoinUs={() => openTermsThen('register')}
            onLogin={() => openTermsThen('login')}
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
              onClick={() => openTermsThen('login')}
            >
              CLAIM WELCOME BONUS
            </button>
          </div>
        </section>

        <section
          className="guest-landing__games-block page-container"
          aria-labelledby="guest-top-games-heading"
        >
          <h2 id="guest-top-games-heading" className="guest-landing__row-title">
            TOP <span className="guest-landing__accent">FREE-TO-PLAY</span> CASINO STYLE GAMES
          </h2>
          {renderGameTrack(GUEST_TOP_GAMES, 0)}
        </section>

        <section
          className="guest-landing__games-block page-container"
          aria-labelledby="guest-demo-games-heading"
        >
          <h2 id="guest-demo-games-heading" className="guest-landing__row-title guest-landing__row-title--demo">
            <span className="guest-landing__accent">DEMO</span> here
          </h2>
          {renderGameTrack(GUEST_DEMO_ROW_GAMES, GUEST_TOP_GAMES.length)}
        </section>

        <div className="guest-landing__signup-cta page-container">
          <button type="button" className="guest-landing__signup-wide" onClick={onGuestSignUp}>
            SIGN UP TO PLAY FOR FREE
          </button>
        </div>

        <LobbyComplianceFooter variant="guest" />
      </main>

      <div className="guest-landing__sticky-bar" role="region" aria-label="Sign up">
        <img
          className="guest-landing__sticky-gift"
          src={FLOATING_CTA_IMAGE}
          alt=""
          width={72}
          height={72}
          decoding="async"
        />
        <button type="button" className="guest-landing__sticky-btn" onClick={onGuestSignUp}>
          SIGN UP TO PLAY FOR FREE
        </button>
      </div>

      <button
        type="button"
        className="guest-landing__chat-fab"
        aria-label="Chat support"
        onClick={onGuestChatClick}
      >
        <svg className="guest-landing__chat-icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden>
          <path
            fill="currentColor"
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          />
        </svg>
      </button>
    </>
  )

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

        <section className="lobby-games-section page-container" aria-labelledby="lobby-games-heading">
          <h2 id="lobby-games-heading" className="lobby-section-title">
            Our Top Games
          </h2>
          {token ? (
            <div className="lobby-game-filter" role="tablist" aria-label="Game categories (demo)">
              {LOBBY_FILTER_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  id={`lobby-tab-${id}`}
                  type="button"
                  className={'lobby-game-filter__tab' + (lobbyFilter === id ? ' is-active' : '')}
                  role="tab"
                  aria-selected={lobbyFilter === id}
                  aria-controls={`lobby-panel-${id}`}
                  tabIndex={lobbyFilter === id ? 0 : -1}
                  onClick={() => onTabClick(id)}
                >
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
              ref={panelsRef}
              className="lobby-games-panels"
              onScroll={onPanelsScroll}
            >
              {LOBBY_FILTER_ORDER.map((panelId) => (
                <div
                  key={panelId}
                  id={`lobby-panel-${panelId}`}
                  className="lobby-games-panel"
                  role="tabpanel"
                  aria-labelledby={`lobby-tab-${panelId}`}
                  aria-hidden={lobbyFilter !== panelId}
                >
                  {renderGameTrack(gamesByFilter[panelId], 0)}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {tpId ? <TrustpilotSection businessUnitId={tpId} /> : null}

        <LobbyComplianceFooter variant="session" />
      </main>
    </>
  )

  return (
    <div
      className={
        'lobby-landing' +
        (user ? ' lobby-landing--session' : ' lobby-landing--guest')
      }
    >
      {user ? (
        <SessionChromeShell headerOverHero>{sessionLandingMain}</SessionChromeShell>
      ) : (
        guestLandingMain
      )}

      <TermsGateModal open={termsOpen} onClose={closeTerms} onAccept={onTermsAccepted} />
      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        onSwitchRegister={() => {
          closeLogin()
          openRegisterDirect()
        }}
      />
      <RegisterModal
        open={registerOpen}
        onClose={() => {
          closeRegister()
          setRegisterEmailForm(false)
        }}
        onSwitchLogin={() => {
          closeRegister()
          openLoginDirect()
        }}
        showEmailForm={registerEmailForm}
        onShowEmailForm={() => setRegisterEmailForm(true)}
        onBackFromEmail={() => setRegisterEmailForm(false)}
      />
    </div>
  )
}
