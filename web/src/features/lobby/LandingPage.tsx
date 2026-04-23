import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { LandingHeader } from '../../components/LandingHeader'
import { SessionChromeShell } from '../../components/session/SessionChromeShell'
import { SiteFooter } from '../../components/SiteFooter'
import { TrustpilotSection } from '../../components/TrustpilotSection'
import { useGameShell } from '../../components/useGameShell'
import { useAuthModals } from '../auth/authModalsContext'
import { LoginModal } from '../auth/LoginModal'
import { RegisterModal } from '../auth/RegisterModal'
import { TermsGateModal } from '../auth/TermsGateModal'
import {
  floatingCtaPath,
  openGamesInNewWindowDefault,
  trustpilotBusinessUnitId,
} from '../../lib/env'
import { ApiError } from '../../lib/api/client'
import { fetchGames } from '../../lib/api/games'
import type { Game } from '../../lib/api/types'
import {
  BENEFITS,
  FLOATING_CTA_IMAGE,
  GUEST_DEMO_GAMES,
  PROVIDERS_ROW_A,
  PROVIDERS_ROW_B,
  getLobbyHeroImage,
  UNITY_DEMO_LOBBY_GAME,
} from './landingContent'
import { ProviderMarquee } from './ProviderMarquee'
import './LobbyPage.css'

const defaultOpenLabel = openGamesInNewWindowDefault() ? 'new tab by default' : 'inline by default'

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
  const heroSrc = getLobbyHeroImage()
  const floatPath = floatingCtaPath()

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

  async function load() {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetchGames(token)
      setApiItems(res.items ?? [])
      await refreshUser()
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not load games'
      setError(msg)
      setApiItems([])
    } finally {
      setLoading(false)
    }
  }

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

  function onGuestGateAction() {
    openTermsThen('login')
  }

  function renderGameTrack(games: Game[]) {
    return (
      <div className="lobby-games-scroller">
        <ul className="lobby-games-track" role="list">
          {games.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="lobby-game-card"
                onClick={() => onPlayGame(g)}
                disabled={!!token && !g.launchUrl}
              >
                <div
                  className="lobby-game-card__thumb"
                  style={
                    g.thumbnailUrl ? { backgroundImage: `url("${g.thumbnailUrl}")` } : undefined
                  }
                >
                  {!g.thumbnailUrl ? (
                    <span className="lobby-game-card__fallback">{g.title}</span>
                  ) : null}
                </div>
                <span className="lobby-game-card__title">{g.title}</span>
                {g.subtitle ? <span className="lobby-game-card__sub">{g.subtitle}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const landingMain = (
    <>
      <main className="lobby-landing__main">
        <section className="lobby-hero-banner" aria-label="Promotional banner">
          <div className="lobby-hero-banner__content page-container">
            <img
              className="lobby-hero-banner__img"
              src={heroSrc}
              alt=""
              width={1200}
              height={420}
              decoding="async"
            />
          </div>
        </section>

        <div className="lobby-claim-wrap page-container">
          {user ? (
            <p className="lobby-welcome">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}
            </p>
          ) : null}
          <div className="lobby-claim-actions">
            {token ? (
              <>
                <button type="button" className="btn-crown-primary" onClick={load} disabled={loading}>
                  {loading ? 'Updating…' : 'Refresh list'}
                </button>
                <Link to="/profile" className="lobby-claim-btn-welcome btn-crown-welcome">
                  CLAIM WELCOME BONUS
                </Link>
              </>
            ) : (
              <>
                <button type="button" className="lobby-claim-btn-welcome btn-crown-welcome" onClick={onGuestGateAction}>
                  CLAIM WELCOME BONUS
                </button>
              </>
            )}
          </div>
          <p className="lobby-hint">
            Inline vs {defaultOpenLabel} can be set by the API or environment variables.
          </p>
        </div>

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
                  {renderGameTrack(gamesByFilter[panelId])}
                </div>
              ))}
            </div>
          ) : (
            renderGameTrack(displayGames)
          )}
        </section>

        {tpId ? <TrustpilotSection businessUnitId={tpId} /> : null}

        <section className="lobby-benefits page-container" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="lobby-section-title">
            Why play with us
          </h2>
          <div className="lobby-benefits__grid">
            {BENEFITS.map((b) => (
              <div key={b.alt} className="lobby-benefit-card">
                <div className="lobby-benefit-card__img-wrap">
                  <img src={b.image} alt={b.alt} loading="lazy" decoding="async" />
                </div>
                {b.htmlLabel ? (
                  <p
                    className="lobby-benefit-card__label"
                    dangerouslySetInnerHTML={{ __html: b.label }}
                  />
                ) : (
                  <p className="lobby-benefit-card__label">{b.label}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="page-container">
          <ProviderMarquee title="Game providers" rowA={PROVIDERS_ROW_A} rowB={PROVIDERS_ROW_B} />
        </div>

        <SiteFooter />
      </main>

      <div className="lobby-floating-cta">
        <div className="lobby-floating-cta__bg" aria-hidden />
        <img
          className="lobby-floating-cta__img"
          src={FLOATING_CTA_IMAGE}
          alt=""
          width={120}
          height={120}
          decoding="async"
        />
        {token ? (
          <Link to={floatPath} className="btn-crown-primary lobby-floating-cta__btn">
            CLAIM YOUR BONUS
          </Link>
        ) : (
          <button
            type="button"
            className="btn-crown-primary lobby-floating-cta__btn"
            onClick={onGuestGateAction}
          >
            CLAIM YOUR BONUS
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className={'lobby-landing' + (user ? ' lobby-landing--session' : '')}>
      {!user ? (
        <LandingHeader
          onJoinUs={() => openTermsThen('register')}
          onLogin={() => openTermsThen('login')}
        />
      ) : null}
      {user ? <SessionChromeShell>{landingMain}</SessionChromeShell> : landingMain}

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
