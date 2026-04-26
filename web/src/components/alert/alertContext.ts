import { createContext, useContext } from 'react'

export type AlertVariant = 'success' | 'error' | 'info'

export type ShowAlertOptions = {
  variant?: AlertVariant
  /** Default 3000. Non-positive values use the default. */
  durationMs?: number
}

export type AlertContextValue = {
  show: (message: string, options?: ShowAlertOptions) => void
}

export const AlertContext = createContext<AlertContextValue | null>(null)

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within AlertProvider')
  return ctx
}
