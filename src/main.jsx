import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Auto-update the service worker every hour
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline')
  },
})

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          minHeight: '100vh', boxSizing: 'border-box', padding: '1.5rem',
          fontFamily: 'system-ui, sans-serif', background: '#1a1a1a', color: '#f5f5f5',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          <h1 style={{ fontSize: '1.1rem', marginTop: 0 }}>Something broke while loading the app</h1>
          <p style={{ opacity: 0.9 }}>Open the browser devtools console (F12 → Console) for the full error. Technical detail:</p>
          <code style={{ display: 'block', marginTop: '1rem', padding: '1rem', background: '#000', borderRadius: 8, fontSize: '0.8rem' }}>
            {String(this.state.err?.message || this.state.err)}
          </code>
        </div>
      )
    }
    return this.props.children
  }
}

const el = document.getElementById('root')
if (!el) {
  console.error('[main.jsx] Missing #root element');
  document.body.textContent = 'Missing #root — check index.html'
} else {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>,
  )
}
