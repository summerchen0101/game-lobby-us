import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/outfit/wght.css'
import './styles/theme-palette.css'
import './styles/theme-seasonal.css'
import './styles/crown-theme.css'
import './index.css'
import './styles/site-background.css'
import { applyThemeFromEnv } from './theme/applyTheme'
import App from './App.tsx'

applyThemeFromEnv()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
