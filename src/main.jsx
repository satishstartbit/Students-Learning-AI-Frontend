import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import './index.css'
import App from './App.jsx'
import { APP_NAME } from './utils/constants'

// The tab title is the product name (VITE_APP_NAME), not the Vite template's.
document.title = APP_NAME

// For public/offline.html, which can't read the app's settings: it shows
// this name when the site is opened with no internet.
try {
  localStorage.setItem('eflp.appName', APP_NAME)
} catch {
  /* storage blocked - the offline page keeps its default name */
}

// public/sw.js: shows public/offline.html when a page is opened with no
// internet. Production builds only, so the dev server is never affected.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* no offline page, the browser's own error shows instead */
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
