import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useGameShell } from '../../components/useGameShell'
import { ApiError } from '../../lib/api/client'
import { fetchGames } from '../../lib/api/games'
import type { Game } from '../../lib/api/types'
import { openGamesInNewWindowDefault } from '../../lib/env'
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
    <div className="lobby">
      <section className="lobby-hero" aria-labelledby="lobby-hero-title">
        <h1 id="lobby-hero-title" className="lobby-hero__title">
          歡迎回來{user?.displayName ? `，${user.displayName}` : ''}
        </h1>
        <p className="lobby-hero__lede">
          從下方選取遊戲進入。內嵌與 {defaultOpenLabel} 可透過後端欄位或環境變數調整。
        </p>
        <p className="lobby-hero__balance" aria-live="polite">
          目前餘額：<strong>{formatBalance(user?.balance, user?.currency)}</strong>
        </p>
        <div className="lobby-hero__actions">
          <button type="button" className="btn btn--primary" onClick={load} disabled={loading}>
            {loading ? '更新中…' : '重新整理列表'}
          </button>
        </div>
      </section>

      <section className="lobby-games" aria-labelledby="lobby-games-title">
        <h2 id="lobby-games-title" className="lobby-games__title">
          遊戲
        </h2>
        {error ? <p className="lobby-games__error">{error}</p> : null}
        {loading && items.length === 0 && !error ? (
          <p className="lobby-games__hint">載入中…</p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="lobby-games__hint">尚無可玩遊戲。</p>
        ) : null}
        <ul className="game-grid" role="list">
          {items.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="game-card"
                onClick={() => onPlayGame(g)}
                disabled={!g.launchUrl}
              >
                <span className="game-card__title">{g.title}</span>
                {g.subtitle ? <span className="game-card__sub">{g.subtitle}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
