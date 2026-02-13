import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { Landing } from './landings/Landing'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />

        {/* Main app */}
        <Route path="/app/*" element={
          <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            signInForceRedirectUrl="/app"
            signUpForceRedirectUrl="/app"
          >
            <App />
          </ClerkProvider>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
