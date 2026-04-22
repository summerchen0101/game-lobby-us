import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { SiteFooter } from '../../components/SiteFooter'
import { TrustpilotSection } from '../../components/TrustpilotSection'
import { useGameShell } from '../../components/useGameShell'
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

export function LobbyPage() {
  const { token, user, refreshUser } = useAuth()
  const { open: openShell } = useGameShell()
  const [items, setItems] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tpId = trustpilotBusinessUnitId()
  const heroSrc = getLobbyHeroImage()
  const floatPath = floatingCtaPath()

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    setError(null)
    setLoading(true)
    void (async () => {
      try {
        const res = await fetchGames(token)
        if (cancelled) return
        setItems(res.items ?? [])
        await refreshUser()
      } catch (e) {
        if (cancelled) return
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法載入遊戲列表'
        setError(msg)
        setItems([])
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
      setItems(res.items ?? [])
      await refreshUser()
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法載入遊戲列表'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function onPlayGame(g: Game) {
    openShell({
      url: g.launchUrl,
      widthPercent: g.embedWidthPercent,
      heightPercent: g.embedHeightPercent,
      isPayment: false,
      openInNewWindow: g.openInNewWindow,
    })
  }

  return (
    <div className="lobby-landing">
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
          <p className="lobby-welcome">
            歡迎回來{user?.displayName ? `，${user.displayName}` : ''} · 餘額{' '}
            <strong>{formatBalance(user?.balance, user?.currency)}</strong>
          </p>
          <div className="lobby-claim-actions">
            <button type="button" className="btn-crown-primary" onClick={load} disabled={loading}>
              {loading ? '更新中…' : '重新整理列表'}
            </button>
            <Link to="/profile" className="btn-crown-secondary lobby-claim-link">
              領取獎勵／儲值
            </Link>
          </div>
          <p className="lobby-hint">內嵌與 {defaultOpenLabel} 可由後端或環境變數調整。</p>
        </div>

        <section className="lobby-games-section page-container" aria-labelledby="lobby-games-heading">
          <h2 id="lobby-games-heading" className="lobby-section-title">
            精選遊戲
          </h2>
          {error ? <p className="lobby-games-error">{error}</p> : null}
          {loading && items.length === 0 && !error ? (
            <p className="lobby-games-hint">載入中…</p>
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <p className="lobby-games-hint">尚無可玩遊戲。</p>
          ) : null}
          <div className="lobby-games-scroller">
            <ul className="lobby-games-track" role="list">
              {items.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className="lobby-game-card"
                    onClick={() => onPlayGame(g)}
                    disabled={!g.launchUrl}
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
        <Link to={floatPath} className="btn-crown-primary lobby-floating-cta__btn">
          領取獎勵
        </Link>
      </div>
    </div>
  )
}
