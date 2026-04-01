import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import AuditorReports     from './pages/auditor/AuditorReports'
import AdminDashboard     from './pages/admin/AdminDashboard'
import MLInsights         from './pages/MLInsights'
import CIRegistry         from './pages/ci/CIRegistry'
import KanbanBoard        from './pages/cr/KanbanBoard'
import CRDetails          from './pages/cr/CRDetails'
import ActivityFeed       from './pages/ActivityFeed'
import DevOpsLayout       from './pages/devops/DevOpsLayout'
import DevOpsDashboard    from './pages/devops/DevOpsDashboard'
import PipelinesPage      from './pages/devops/PipelinesPage'
import ReleasesPage       from './pages/devops/ReleasesPage'
import EnvironmentsPage   from './pages/devops/EnvironmentsPage'

const DEVOPS_ROLES = ['Developer', 'Project Manager', 'CCB Member', 'Auditor', 'Admin']

function AppLayout({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  // Auth pages are always full-screen (no sidebar), even if session exists from a fresh signup
  if (!user || isAuthPage) return <>{children}</>
  return (
    <div className="flex min-h-screen bg-background text-textMain relative overflow-hidden">
      {/* Global Fusion AI Dual-Tone Background Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <Sidebar />
      <main className="flex-1 flex flex-col items-stretch justify-start min-w-0 p-6 md:p-10 ml-0 md:ml-64 transition-all relative z-10 overflow-x-auto">
        <div className="w-full max-w-[1400px] mx-auto min-w-0">
          {children}
        </div>
      </main>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
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

            {/* New Routes */}
            <Route path="/baselines" element={<ProtectedRoute><AuditorDashboard /></ProtectedRoute>} />
            <Route path="/audits" element={<ProtectedRoute><AuditorDashboard /></ProtectedRoute>} />
            <Route path="/cis" element={<ProtectedRoute><Navigate to="/ci-registry" replace /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/crs/:id" element={<ProtectedRoute><CRDetails /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityFeed /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AuditorReports /></ProtectedRoute>} />

            <Route path="/devops" element={
              <ProtectedRoute allowedRoles={DEVOPS_ROLES}>
                <DevOpsLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DevOpsDashboard />} />
              <Route path="pipelines" element={<PipelinesPage />} />
              <Route path="releases" element={<ReleasesPage />} />
              <Route path="environments" element={<EnvironmentsPage />} />
            </Route>

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
            <Route path="/auditor/reports" element={
              <ProtectedRoute allowedRoles={['Auditor']}>
                <AuditorReports />
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

            {/* CI Registry — IEEE 828 §5.2 — PM, Auditor, Admin */}
            <Route path="/ci-registry" element={
              <ProtectedRoute allowedRoles={['Project Manager','Auditor','Admin']}>
                <CIRegistry />
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
