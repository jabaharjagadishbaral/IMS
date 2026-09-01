import { StrictMode } from 'react'

window.storage = { async get(key, shared) { const k = (shared ? 'shared:' : 'priv:') + key; const v = localStorage.getItem(k); return v === null ? null : { key, value: v, shared: !!shared }; }, async set(key, value, shared) { const k = (shared ? 'shared:' : 'priv:') + key; localStorage.setItem(k, value); return { key, value, shared: !!shared }; }, };

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
