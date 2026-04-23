import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { GameShellProvider } from './components/GameShellProvider'
import { IosInstallGuide } from './components/IosInstallGuide'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { SessionLayout } from './components/session/SessionLayout'
import { ZendeskLoader } from './components/ZendeskLoader'
import { AuthModalsProvider } from './features/auth/AuthModalsProvider'
import { LoginRedirect, RegisterRedirect } from './features/auth/AuthRedirects'
import { EventsRedirect } from './features/lobby/EventsRedirect'
import { LandingPage } from './features/lobby/LandingPage'
import { ProfilePage } from './features/lobby/ProfilePage'
import { PromoPage } from './features/lobby/PromoPage'
import { RedeemPage } from './features/lobby/RedeemPage'
import { ShopPage } from './features/shop/ShopPage'
import { WalletProvider } from './wallet/WalletProvider'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <AuthModalsProvider>
            <GameShellProvider>
              <ZendeskLoader />
              <PwaInstallBanner />
              <IosInstallGuide />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginRedirect />} />
                <Route path="/register" element={<RegisterRedirect />} />
                <Route element={<RequireAuth />}>
                  <Route path="/events" element={<EventsRedirect />} />
                  <Route element={<SessionLayout />}>
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/redeem" element={<RedeemPage />} />
                    <Route path="/promo" element={<PromoPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </GameShellProvider>
          </AuthModalsProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
