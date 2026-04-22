import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useGameShell } from '../../components/useGameShell'
import { ApiError } from '../../lib/api/client'
import { fetchDepositUrl } from '../../lib/api/wallet'
import { mockBumpBalance } from '../../lib/api/mock'
import { isMockMode } from '../../lib/env'
import './ProfilePage.css'

function formatBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return '—'
  const u = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)
  return currency ? `${u} ${currency}` : u
}

export function ProfilePage() {
  const { user, token, refreshUser, logout } = useAuth()
  const { open: openShell } = useGameShell()
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onRefresh = useCallback(async () => {
    setError(null)
    try {
      await refreshUser()
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法重新整理'
      setError(msg)
    }
  }, [refreshUser])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        onRefresh()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [onRefresh])

  async function onDeposit() {
    if (!token) return
    setError(null)
    setDepositing(true)
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
      const res = await fetchDepositUrl(token, returnUrl)
      openShell({
        url: res.url,
        isPayment: true,
        openInNewWindow: res.openInNewWindow,
      })
      if (isMockMode()) {
        mockBumpBalance()
        await refreshUser()
      }
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : '無法取得儲值頁'
      setError(msg)
    } finally {
      setDepositing(false)
    }
  }

  return (
    <section className="profile-page page-container">
      <h1 className="profile-page__title">我的</h1>
      <div className="profile-card">
        <dl className="profile-card__list">
          <div className="profile-card__row">
            <dt>顯示名稱</dt>
            <dd>{user?.displayName ?? '—'}</dd>
          </div>
          <div className="profile-card__row">
            <dt>帳戶 ID</dt>
            <dd>{user?.id ?? '—'}</dd>
          </div>
          <div className="profile-card__row">
            <dt>餘額</dt>
            <dd>
              <strong>{formatBalance(user?.balance, user?.currency)}</strong>
            </dd>
          </div>
        </dl>
        {error ? <p className="profile-card__error">{error}</p> : null}
        <div className="profile-card__actions">
          <button
            type="button"
            className="btn-crown-primary profile-card__btn-full"
            onClick={onDeposit}
            disabled={depositing}
          >
            {depositing ? '準備中…' : '儲值'}
          </button>
          <button type="button" className="btn-crown-ghost profile-card__btn-full" onClick={onRefresh}>
            重新整理餘額
          </button>
          <button type="button" className="btn-crown-ghost profile-card__btn-full" onClick={() => logout()}>
            登出
          </button>
        </div>
        <p className="profile-card__hint">
          從金流或外部頁面返回此分頁時，會嘗試自動重新整理餘額；若數字未更新請手動按「重新整理餘額」。
        </p>
      </div>
    </section>
  )
}
