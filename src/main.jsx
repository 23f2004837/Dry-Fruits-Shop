import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Register service worker for PWA (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'

// Attempt immediate registration; plugin is configured for autoUpdate
const updateSW = registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
