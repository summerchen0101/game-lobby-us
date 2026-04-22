import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { LandingHeader } from '../../components/LandingHeader'
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
} from './landingContent'
import { ProviderMarquee } from './ProviderMarquee'
import './LobbyPage.css'

const defaultOpenLabel = openGamesInNewWindowDefault() ? '預設新分頁' : '預設內嵌'

function formatBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return '—'
  const u = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)
  return currency ? `${u} ${currency}` : u
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

  const tpId = trustpilotBusinessUnitId()
  const heroSrc = getLobbyHeroImage()
  const floatPath = floatingCtaPath()

  const displayGames = useMemo(
    () => (token ? apiItems : GUEST_DEMO_GAMES),
    [token, apiItems],
  )

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
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法載入遊戲列表'
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
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法載入遊戲列表'
      setError(msg)
      setApiItems([])
    } finally {
      setLoading(false)
    }
  }

  function onPlayGame(g: Game) {
    if (!token) {
      openTermsThen('login')
      return
    }
    if (!g.launchUrl) return
    openShell({
      url: g.launchUrl,
      widthPercent: g.embedWidthPercent,
      heightPercent: g.embedHeightPercent,
      isPayment: false,
      openInNewWindow: g.openInNewWindow,
    })
  }

  function onGuestGateAction() {
    openTermsThen('login')
  }

  return (
    <div className="lobby-landing">
      <LandingHeader
        onJoinUs={() => openTermsThen('register')}
        onLogin={() => openTermsThen('login')}
      />

      <main className="lobby-landing__main">
        <section className="lobby-hero-banner" aria-label="促銷主視覺">
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
              歡迎回來{user.displayName ? `，${user.displayName}` : ''} · 餘額{' '}
              <strong>{formatBalance(user.balance, user.currency)}</strong>
            </p>
          ) : null}
          <div className="lobby-claim-actions">
            {token ? (
              <>
                <button type="button" className="btn-crown-primary" onClick={load} disabled={loading}>
                  {loading ? '更新中…' : '重新整理列表'}
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
          <p className="lobby-hint">內嵌與 {defaultOpenLabel} 可由後端或環境變數調整。</p>
        </div>

        <section className="lobby-games-section page-container" aria-labelledby="lobby-games-heading">
          <h2 id="lobby-games-heading" className="lobby-section-title">
            Our Top Games
          </h2>
          {error ? <p className="lobby-games-error">{error}</p> : null}
          {token && loading && displayGames.length === 0 && !error ? (
            <p className="lobby-games-hint">載入中…</p>
          ) : null}
          {token && !loading && !error && displayGames.length === 0 ? (
            <p className="lobby-games-hint">尚無可玩遊戲。</p>
          ) : null}
          <div className="lobby-games-scroller">
            <ul className="lobby-games-track" role="list">
              {displayGames.map((g) => (
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
                        g.thumbnailUrl
                          ? { backgroundImage: `url("${g.thumbnailUrl}")` }
                          : undefined
                      }
                    >
                      {!g.thumbnailUrl ? (
                        <span className="lobby-game-card__fallback">{g.title}</span>
                      ) : null}
                    </div>
                    <span className="lobby-game-card__title">{g.title}</span>
                    {g.subtitle ? (
                      <span className="lobby-game-card__sub">{g.subtitle}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {tpId ? <TrustpilotSection businessUnitId={tpId} /> : null}

        <section className="lobby-benefits page-container" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="lobby-section-title">
            平台優勢
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
          <ProviderMarquee title="遊戲供應商" rowA={PROVIDERS_ROW_A} rowB={PROVIDERS_ROW_B} />
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
