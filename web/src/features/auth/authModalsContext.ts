import { createContext, useContext } from 'react'

export type PostTermsAction = 'login' | 'register'

export type AuthModalsContextValue = {
  termsOpen: boolean
  loginOpen: boolean
  registerOpen: boolean
  openTermsThen: (next: PostTermsAction) => void
  openLoginDirect: () => void
  openRegisterDirect: () => void
  closeTerms: () => void
  closeLogin: () => void
  closeRegister: () => void
  closeAllModals: () => void
  onTermsAccepted: () => void
  hasAcceptedTerms: () => boolean
}

export const AuthModalsContext = createContext<AuthModalsContextValue | null>(null)

export function useAuthModals() {
  const ctx = useContext(AuthModalsContext)
  if (!ctx) throw new Error('useAuthModals must be used within AuthModalsProvider')
  return ctx
}
