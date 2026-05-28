import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Telegram WebApp init
const tg = window.Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  // Dark tema majburiy
  document.documentElement.style.setProperty('--tg-color-scheme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
