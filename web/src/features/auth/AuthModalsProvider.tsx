import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthModalsContext, type PostTermsAction } from './authModalsContext'

const TERMS_KEY = 'wynoco_terms_ok'

export function AuthModalsProvider({ children }: { children: ReactNode }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [pendingAfterTerms, setPendingAfterTerms] = useState<PostTermsAction | null>(null)

  const hasAcceptedTerms = useCallback(() => sessionStorage.getItem(TERMS_KEY) === '1', [])

  const openLoginDirect = useCallback(() => {
    setLoginOpen(true)
    setRegisterOpen(false)
  }, [])

  const openRegisterDirect = useCallback(() => {
    setRegisterOpen(true)
    setLoginOpen(false)
  }, [])

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

  const closeAllModals = useCallback(() => {
    setTermsOpen(false)
    setLoginOpen(false)
    setRegisterOpen(false)
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
      openTermsThen,
      openLoginDirect,
      openRegisterDirect,
      closeTerms,
      closeLogin,
      closeRegister,
      closeAllModals,
      onTermsAccepted,
      hasAcceptedTerms,
    }),
    [
      termsOpen,
      loginOpen,
      registerOpen,
      openTermsThen,
      openLoginDirect,
      openRegisterDirect,
      closeTerms,
      closeLogin,
      closeRegister,
      closeAllModals,
      onTermsAccepted,
      hasAcceptedTerms,
    ],
  )

  return <AuthModalsContext.Provider value={value}>{children}</AuthModalsContext.Provider>
}
