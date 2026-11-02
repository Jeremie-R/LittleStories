import '@fontsource-variable/plus-jakarta-sans/wght.css'
import './styles/base.css'
import './styles/components.css'
import './styles/screens.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthProvider } from './auth/AuthProvider'
import { FeedbackProvider } from './components/Feedback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </AuthProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
