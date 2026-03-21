import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FarmsPage from './pages/FarmsPage'
import BatchesPage from './pages/BatchesPage'
import ProcurementPage from './pages/ProcurementPage'
import InventoryPage from './pages/InventoryPage'
import DailyReportsPage from './pages/DailyReportsPage'
import WeighingPage from './pages/WeighingPage'
import TransportPage from './pages/TransportPage'
import ProcessingPage from './pages/ProcessingPage'
import SalesPage from './pages/SalesPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import { ToastProvider } from './components/Toast'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const hydrate = useAuthStore(s => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/farms" element={
              <RequireRole roles={['admin', 'supervisor']}><FarmsPage /></RequireRole>
            } />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/procurement" element={
              <RequireRole roles={['admin']}><ProcurementPage /></RequireRole>
            } />
            <Route path="/inventory" element={
              <RequireRole roles={['admin']}><InventoryPage /></RequireRole>
            } />
            <Route path="/daily-reports" element={<DailyReportsPage />} />
            <Route path="/weighing" element={<WeighingPage />} />
            <Route path="/transport" element={<TransportPage />} />
            <Route path="/processing" element={
              <RequireRole roles={['admin', 'operator']}><ProcessingPage /></RequireRole>
            } />
            <Route path="/sales" element={
              <RequireRole roles={['admin']}><SalesPage /></RequireRole>
            } />
            <Route path="/reports" element={
              <RequireRole roles={['admin', 'supervisor']}><ReportsPage /></RequireRole>
            } />
            <Route path="/users" element={
              <RequireRole roles={['admin']}><UsersPage /></RequireRole>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
