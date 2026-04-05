import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import ScrollToHash from './ScrollToHash'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import RecycleBinPage from './pages/RecycleBinPage'
import PurchaseTokensPage from './pages/PurchaseTokensPage'
import SiteEditPage from './pages/SiteEditPage'
import GeneratorPage from './pages/GeneratorPage'
import BiryaniBluesPage from './pages/BiryaniBluesPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CancellationRefundPage from './pages/policies/CancellationRefundPage'
import TermsPage from './pages/policies/TermsPage'
import ShippingPage from './pages/policies/ShippingPage'
import PrivacyPage from './pages/policies/PrivacyPage'
import ContactPage from './pages/policies/ContactPage'
import { trackEvent, trackPageView } from './utils/analytics'

/**
 * Fires a GA4 `page_view` on every route change (SPA navigation).
 * Also attaches a document-level listener that captures EVERY button/link
 * click across the entire site and sends a `click` event to GA4.
 */
function AnalyticsLayer() {
  const location = useLocation()

  // SPA page-view tracking
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title)
  }, [location.pathname, location.search])

  // Global click auto-tracker — captures ALL button and link clicks
  useEffect(() => {
    function handleClick(e) {
      const el = e.target.closest('button, a, [role="button"], [role="link"]')
      if (!el) return

      const tag = el.tagName.toLowerCase()
      const label = (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.getAttribute('data-track-label') ||
        el.innerText?.trim().replace(/\s+/g, ' ').substring(0, 120) ||
        tag
      ).substring(0, 150)

      const href = tag === 'a' ? (el.getAttribute('href') || '') : ''

      trackEvent('click', {
        element_type: tag,
        element_label: label,
        ...(href ? { element_href: href } : {}),
        page_path: window.location.pathname,
      })
    }

    document.addEventListener('click', handleClick, { passive: true, capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsLayer />
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/example/biryani-blues" element={<BiryaniBluesPage />} />
          <Route element={<AppShell />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/dashboard/sites/:siteId/publish"
              element={
                <ProtectedRoute>
                  <SiteEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sites/:siteId"
              element={
                <ProtectedRoute>
                  <SiteEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recycle-bin"
              element={
                <ProtectedRoute>
                  <RecycleBinPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-tokens"
              element={
                <ProtectedRoute>
                  <PurchaseTokensPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <GeneratorPage />
                </ProtectedRoute>
              }
            />
          </Route>
          {/* Public policy pages — no auth required */}
          <Route path="/policies/cancellation-refunds" element={<CancellationRefundPage />} />
          <Route path="/policies/terms" element={<TermsPage />} />
          <Route path="/policies/shipping" element={<ShippingPage />} />
          <Route path="/policies/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
