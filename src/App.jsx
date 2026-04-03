import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
