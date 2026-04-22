import { Route, BrowserRouter, Navigate, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/AppShell'
import { GameShellProvider } from './components/GameShellProvider'
import { IosInstallGuide } from './components/IosInstallGuide'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { ZendeskLoader } from './components/ZendeskLoader'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { EventsPage } from './features/lobby/EventsPage'
import { LobbyPage } from './features/lobby/LobbyPage'
import { ProfilePage } from './features/lobby/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameShellProvider>
          <ZendeskLoader />
          <PwaInstallBanner />
          <IosInstallGuide />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<LobbyPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameShellProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
