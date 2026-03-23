import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, GitPullRequest, FolderOpen, Shield,
  CheckSquare, BarChart3, Users, LogOut, Cpu, FileText
} from 'lucide-react'

const ROLE_NAV = {
  Developer: [
    { to: '/developer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/developer/submit-cr', label: 'Submit Change Request', icon: GitPullRequest },
    { to: '/ml-insights', label: 'ML Risk Insights', icon: Cpu },
  ],
  'Project Manager': [
    { to: '/pm', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pm/projects', label: 'Projects', icon: FolderOpen },
    { to: '/ml-insights', label: 'ML Risk Insights', icon: Cpu },
  ],
  'CCB Member': [
    { to: '/ccb', label: 'CCB Dashboard', icon: Shield },
    { to: '/ml-insights', label: 'ML Risk Insights', icon: Cpu },
  ],
  Auditor: [
    { to: '/auditor', label: 'Audit Dashboard', icon: CheckSquare },
    { to: '/auditor/baselines', label: 'Baselines', icon: FileText },
    { to: '/ml-insights', label: 'ML Risk Insights', icon: Cpu },
  ],
  Admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/ml-insights', label: 'ML Risk Insights', icon: Cpu },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const navItems = ROLE_NAV[user.role] || []
  const initials = (user.name || user.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">I</div>
        <div>
          <div className="logo-text">Intelli<span>SCM</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to} end={to.split('/').length <= 2}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )
}
