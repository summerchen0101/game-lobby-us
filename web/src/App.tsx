import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/AppShell'
import { GameShellProvider } from './components/GameShellProvider'
import { IosInstallGuide } from './components/IosInstallGuide'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { ZendeskLoader } from './components/ZendeskLoader'
import { AuthModalsProvider } from './features/auth/AuthModalsProvider'
import { LoginRedirect, RegisterRedirect } from './features/auth/AuthRedirects'
import { EventsPage } from './features/lobby/EventsPage'
import { LandingPage } from './features/lobby/LandingPage'
import { ProfilePage } from './features/lobby/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
                <Route element={<AppShell />}>
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GameShellProvider>
        </AuthModalsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
