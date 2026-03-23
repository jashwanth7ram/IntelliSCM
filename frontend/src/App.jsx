import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'

// Auth pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Role dashboards
import DeveloperDashboard from './pages/developer/DeveloperDashboard'
import SubmitCR           from './pages/developer/SubmitCR'
import PMDashboard        from './pages/pm/PMDashboard'
import CCBDashboard       from './pages/ccb/CCBDashboard'
import AuditorDashboard   from './pages/auditor/AuditorDashboard'
import AdminDashboard     from './pages/admin/AdminDashboard'
import MLInsights         from './pages/MLInsights'

function AppLayout({ children }) {
  const { user } = useAuth()
  if (!user) return children
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-container"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  const routes = {
    Developer: '/developer',
    'Project Manager': '/pm',
    'CCB Member': '/ccb',
    Auditor: '/auditor',
    Admin: '/admin',
  }
  return <Navigate to={routes[user.role] || '/developer'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Root — redirects by role */}
            <Route path="/" element={<RootRedirect />} />

            {/* Developer */}
            <Route path="/developer" element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            } />
            <Route path="/developer/submit-cr" element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <SubmitCR />
              </ProtectedRoute>
            } />

            {/* Project Manager */}
            <Route path="/pm" element={
              <ProtectedRoute allowedRoles={['Project Manager']}>
                <PMDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pm/projects" element={
              <ProtectedRoute allowedRoles={['Project Manager']}>
                <PMDashboard />
              </ProtectedRoute>
            } />

            {/* CCB */}
            <Route path="/ccb" element={
              <ProtectedRoute allowedRoles={['CCB Member']}>
                <CCBDashboard />
              </ProtectedRoute>
            } />

            {/* Auditor */}
            <Route path="/auditor" element={
              <ProtectedRoute allowedRoles={['Auditor']}>
                <AuditorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/auditor/baselines" element={
              <ProtectedRoute allowedRoles={['Auditor']}>
                <AuditorDashboard />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* ML Insights — accessible by all authenticated roles */}
            <Route path="/ml-insights" element={
              <ProtectedRoute allowedRoles={['Developer','Project Manager','CCB Member','Auditor','Admin']}>
                <MLInsights />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  )
}
