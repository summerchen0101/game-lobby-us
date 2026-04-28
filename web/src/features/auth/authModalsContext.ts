import { createContext, useContext } from 'react'
import type { RegisterBody } from '../../lib/api/types'

export type PostTermsAction = 'login' | 'register'

/** Data carried from Register modal into the OTP step (display only; code is sent to email). */
export type PhoneVerifyPayload = {
  body: RegisterBody
  displayEmail: string
}

export type AuthModalsContextValue = {
  termsOpen: boolean
  loginOpen: boolean
  registerOpen: boolean
  forgotPasswordOpen: boolean
  phoneVerifyOpen: boolean
  phoneVerifyPayload: PhoneVerifyPayload | null
  openTermsThen: (next: PostTermsAction) => void
  openLoginDirect: () => void
  openRegisterDirect: () => void
  openForgotPasswordDirect: () => void
  openPhoneVerify: (payload: PhoneVerifyPayload) => void
  closePhoneVerify: () => void
  closeTerms: () => void
  closeLogin: () => void
  closeRegister: () => void
  closeForgotPassword: () => void
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
