import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/auth'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { TrackingPage } from './pages/public/TrackingPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { SpaBoard } from './pages/manager/SpaBoard'
import { RoutePage } from './pages/driver/RoutePage'
import { WasherPage } from './pages/washer/WasherPage'
import { PricesPage } from './pages/admin/PricesPage'
import { UsersPage } from './pages/admin/UsersPage'
import type { Role } from './types'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, hasRole } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user } = useAuthStore()
  const map: Record<Role, string> = {
    admin: '/dashboard',
    agent: '/orders',
    manager: '/spa',
    driver: '/route',
    washer: '/rugs',
  }
  if (user?.role) return <Navigate to={map[user.role]} replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth roles={['admin']}>
                <AppShell><DashboardPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth roles={['admin', 'agent', 'manager']}>
                <AppShell><OrdersPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth roles={['admin', 'agent', 'manager']}>
                <AppShell><OrderDetailPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/clients"
            element={
              <RequireAuth roles={['admin', 'agent', 'manager']}>
                <AppShell><ClientsPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <RequireAuth roles={['admin', 'agent', 'manager']}>
                <AppShell><ClientDetailPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/spa"
            element={
              <RequireAuth roles={['admin', 'manager']}>
                <AppShell><SpaBoard /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/route"
            element={
              <RequireAuth roles={['driver']}>
                <AppShell><RoutePage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/rugs"
            element={
              <RequireAuth roles={['washer']}>
                <AppShell><WasherPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/prices"
            element={
              <RequireAuth roles={['admin']}>
                <AppShell><PricesPage /></AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth roles={['admin']}>
                <AppShell><UsersPage /></AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
