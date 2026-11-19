import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthGate from './AuthGate.jsx'
import ChatAppErrorBoundary from './ChatAppErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChatAppErrorBoundary>
      <AuthGate />
    </ChatAppErrorBoundary>
  </StrictMode>,
)
