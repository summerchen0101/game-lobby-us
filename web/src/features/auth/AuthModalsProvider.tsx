import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthModalsContext, type PostTermsAction, type PhoneVerifyPayload } from './authModalsContext'

const TERMS_KEY = 'wynoco_terms_ok'

export function AuthModalsProvider({ children }: { children: ReactNode }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false)
  const [phoneVerifyPayload, setPhoneVerifyPayload] = useState<PhoneVerifyPayload | null>(null)
  const [pendingAfterTerms, setPendingAfterTerms] = useState<PostTermsAction | null>(null)

  const hasAcceptedTerms = useCallback(() => sessionStorage.getItem(TERMS_KEY) === '1', [])

  const openLoginDirect = useCallback(() => {
    setLoginOpen(true)
    setRegisterOpen(false)
    setForgotPasswordOpen(false)
    setPhoneVerifyOpen(false)
    setPhoneVerifyPayload(null)
  }, [])

  const openRegisterDirect = useCallback(() => {
    setRegisterOpen(true)
    setLoginOpen(false)
    setForgotPasswordOpen(false)
    setPhoneVerifyOpen(false)
    setPhoneVerifyPayload(null)
  }, [])

  const openForgotPasswordDirect = useCallback(() => {
    setForgotPasswordOpen(true)
    setLoginOpen(false)
    setRegisterOpen(false)
    setPhoneVerifyOpen(false)
    setPhoneVerifyPayload(null)
  }, [])

  const closeForgotPassword = useCallback(() => setForgotPasswordOpen(false), [])

  const openTermsThen = useCallback(
    (next: PostTermsAction) => {
      if (hasAcceptedTerms()) {
        if (next === 'login') openLoginDirect()
        else openRegisterDirect()
        return
      }
      setPendingAfterTerms(next)
      setTermsOpen(true)
    },
    [hasAcceptedTerms, openLoginDirect, openRegisterDirect],
  )

  const closeTerms = useCallback(() => {
    setTermsOpen(false)
    setPendingAfterTerms(null)
  }, [])

  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const closeRegister = useCallback(() => setRegisterOpen(false), [])

  const openPhoneVerify = useCallback((payload: PhoneVerifyPayload) => {
    setRegisterOpen(false)
    setLoginOpen(false)
    setForgotPasswordOpen(false)
    setPhoneVerifyPayload(payload)
    setPhoneVerifyOpen(true)
  }, [])

  const closePhoneVerify = useCallback(() => {
    setPhoneVerifyOpen(false)
    setPhoneVerifyPayload(null)
  }, [])

  const closeAllModals = useCallback(() => {
    setTermsOpen(false)
    setLoginOpen(false)
    setRegisterOpen(false)
    setForgotPasswordOpen(false)
    setPhoneVerifyOpen(false)
    setPhoneVerifyPayload(null)
    setPendingAfterTerms(null)
  }, [])

  const onTermsAccepted = useCallback(() => {
    sessionStorage.setItem(TERMS_KEY, '1')
    setTermsOpen(false)
    const next = pendingAfterTerms ?? 'login'
    setPendingAfterTerms(null)
    if (next === 'login') openLoginDirect()
    else openRegisterDirect()
  }, [pendingAfterTerms, openLoginDirect, openRegisterDirect])

  const value = useMemo(
    () => ({
      termsOpen,
      loginOpen,
      registerOpen,
      forgotPasswordOpen,
      phoneVerifyOpen,
      phoneVerifyPayload,
      openTermsThen,
      openLoginDirect,
      openRegisterDirect,
      openForgotPasswordDirect,
      openPhoneVerify,
      closePhoneVerify,
      closeTerms,
      closeLogin,
      closeRegister,
      closeForgotPassword,
      closeAllModals,
      onTermsAccepted,
      hasAcceptedTerms,
    }),
    [
      termsOpen,
      loginOpen,
      registerOpen,
      forgotPasswordOpen,
      phoneVerifyOpen,
      phoneVerifyPayload,
      openTermsThen,
      openLoginDirect,
      openRegisterDirect,
      openForgotPasswordDirect,
      openPhoneVerify,
      closePhoneVerify,
      closeTerms,
      closeLogin,
      closeRegister,
      closeForgotPassword,
      closeAllModals,
      onTermsAccepted,
      hasAcceptedTerms,
    ],
  )

  return <AuthModalsContext.Provider value={value}>{children}</AuthModalsContext.Provider>
}
