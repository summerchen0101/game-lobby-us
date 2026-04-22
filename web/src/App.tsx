import { Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { IosInstallGuide } from './components/IosInstallGuide'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { ZendeskLoader } from './components/ZendeskLoader'
import { EventsPage } from './features/lobby/EventsPage'
import { LobbyPage } from './features/lobby/LobbyPage'
import { ProfilePage } from './features/lobby/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <ZendeskLoader />
      <PwaInstallBanner />
      <IosInstallGuide />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
