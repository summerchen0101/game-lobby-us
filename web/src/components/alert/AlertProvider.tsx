import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertContext, type AlertVariant, type ShowAlertOptions } from './alertContext'
import './AlertProvider.css'

const DEFAULT_DURATION_MS = 3000

type ToastState = {
  message: string
  variant: AlertVariant
} | null

function AlertToast({ message, variant }: { message: string; variant: AlertVariant }) {
  const isError = variant === 'error'
  return (
    <div
      className={'global-alert' + (isError ? ' global-alert--error' : ' global-alert--' + variant)}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (message: string, options?: ShowAlertOptions) => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
        clearTimerRef.current = null
      }
      const variant: AlertVariant = options?.variant ?? 'info'
      const requested = options?.durationMs ?? DEFAULT_DURATION_MS
      const duration = requested > 0 ? requested : DEFAULT_DURATION_MS
      setState({ message, variant })
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null
        setState(null)
      }, duration)
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  const value = { show }

  const toast =
    state &&
    createPortal(
      <div className="global-alert-portal" role="presentation">
        <AlertToast message={state.message} variant={state.variant} />
      </div>,
      document.body,
    )

  return (
    <AlertContext.Provider value={value}>
      {children}
      {toast}
    </AlertContext.Provider>
  )
}
