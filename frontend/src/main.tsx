import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { GOOGLE_AUTH_CONFIG } from './config/auth'
import { SidebarProvider } from './contexts/SidebarContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CONFIG.clientId}>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
