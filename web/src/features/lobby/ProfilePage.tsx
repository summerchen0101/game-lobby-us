import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useGameShell } from '../../components/useGameShell'
import { ApiError } from '../../lib/api/client'
import { fetchDepositUrl } from '../../lib/api/wallet'
import { mockBumpBalance } from '../../lib/api/mock'
import { isMockMode } from '../../lib/env'
import './ProfilePage.css'
import './SessionPageDecor.css'

const SOUND_KEY = 'wynoco_profile_sound_on'

function formatBalance(n: number | undefined, currency?: string) {
  if (n === undefined) return '—'
  const u = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
  return currency ? `${u} ${currency}` : u
}

export function ProfilePage() {
  const { user, token, refreshUser, logout } = useAuth()
  const { open: openShell } = useGameShell()
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const fundsRef = useRef<HTMLDialogElement>(null)
  const liveId = useId()

  const onRefresh = useCallback(async () => {
    setError(null)
    try {
      await refreshUser()
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not refresh'
      setError(msg)
    }
  }, [refreshUser])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = window.localStorage.getItem(SOUND_KEY)
    if (v === '0') {
      setSoundOn(false)
    } else if (v === '1') {
      setSoundOn(true)
    }
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        onRefresh()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [onRefresh])

  const initial = (user?.displayName?.trim()?.[0] ?? user?.id?.[0] ?? '?').toUpperCase()

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
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not open add funds'
      setError(msg)
    } finally {
      setDepositing(false)
    }
  }

  async function copyUid() {
    if (!user?.id) return
    setCopyMsg(null)
    try {
      await navigator.clipboard.writeText(user.id)
      setCopyMsg('Copied')
    } catch {
      setCopyMsg('Could not copy—select the ID manually')
    }
    window.setTimeout(() => setCopyMsg(null), 2500)
  }

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SOUND_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  function onMyProfile() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onSupport() {
    window.location.href = 'mailto:support@example.com?subject=Support%20request'
  }

  function openFunds() {
    fundsRef.current?.showModal()
  }

  function closeFunds() {
    fundsRef.current?.close()
  }

  return (
    <section className="profile-page page-container session-page session-page--pattern">
      <h1 className="profile-page__title">PROFILE</h1>
      <div className="profile-page__card">
        <div className="profile-page__hero">
          <div className="profile-page__avatar" aria-hidden>
            {initial}
            <button
              type="button"
              className="profile-page__edit"
              title="Edit (preview)"
              aria-label="Edit (preview)"
              tabIndex={-1}
            >
              ✎
            </button>
          </div>
          <div className="profile-page__uid-block">
            <p className="profile-page__uid-label">UID</p>
            <div className="profile-page__uid-row">
              <p className="profile-page__uid">{user?.id ?? '—'}</p>
              <button
                type="button"
                className="profile-page__copy"
                onClick={() => {
                  void copyUid()
                }}
                disabled={!user?.id}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
        {copyMsg ? (
          <p className="profile-page__copy-toast" id={liveId} role="status" aria-live="polite">
            {copyMsg}
          </p>
        ) : null}

        <div className="profile-page__rank">
          <div className="profile-page__rank-top">
            <h2 className="profile-page__rank-name">Formal</h2>
            <p className="profile-page__rank-pct">0%</p>
          </div>
          <div className="profile-page__bar" aria-hidden>
            <div className="profile-page__bar-fill" />
          </div>
        </div>

        <div className="profile-page__sound">
          <span className="profile-page__sound-label" id="sound-label">
            Sound
          </span>
          <button
            type="button"
            className="profile-page__switch"
            role="switch"
            aria-checked={soundOn}
            aria-labelledby="sound-label"
            onClick={toggleSound}
          >
            <span className="profile-page__switch-thumb" />
          </button>
        </div>

        <div className="profile-page__btns">
          <button type="button" className="profile-page__btn-pill" onClick={onMyProfile}>
            MY PROFILE
          </button>
          <button type="button" className="profile-page__btn-pill" onClick={onSupport}>
            SUPPORT
          </button>
          <button
            type="button"
            className="profile-page__btn-pill profile-page__btn-pill--dark"
            onClick={openFunds}
          >
            FUNDS HISTORY
          </button>
          <button type="button" className="profile-page__btn-pill" onClick={() => logout()}>
            SIGN OUT
          </button>
        </div>

        <div className="profile-page__wallet">
          <p className="profile-page__wallet-title">Wallet</p>
          <p className="profile-page__uid" style={{ margin: 0, fontSize: '0.88rem' }}>
            Balance: <strong style={{ color: 'var(--crown-gold, #e6c040)' }}>{formatBalance(user?.balance, user?.currency)}</strong>
          </p>
          {error ? <p className="profile-page__error">{error}</p> : null}
          <div className="profile-page__wallet-row">
            <button
              type="button"
              className="btn-crown-primary profile-page__btn-block"
              onClick={() => onDeposit()}
              disabled={depositing}
            >
              {depositing ? 'Preparing…' : 'Add funds'}
            </button>
            <button
              type="button"
              className="btn-crown-ghost profile-page__btn-block"
              onClick={onRefresh}
            >
              Refresh balance
            </button>
          </div>
        </div>

        <p className="profile-page__hint">
          When you return from checkout or another page, we try to refresh your balance. If the
          amount looks stale, tap &quot;Refresh balance&quot; manually.
        </p>
      </div>

      <dialog
        ref={fundsRef}
        className="profile-page__dialog"
        onClose={closeFunds}
        aria-labelledby="funds-title"
      >
        <h2 id="funds-title" className="profile-page__dialog-title">
          Funds history
        </h2>
        <p className="profile-page__dialog-text">Transaction history will appear here when connected to the backend.</p>
        <button
          type="button"
          className="btn-crown-primary profile-page__dialog-close"
          onClick={closeFunds}
        >
          OK
        </button>
      </dialog>
    </section>
  )
}
