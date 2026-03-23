import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaHome, FaCodeBranch, FaFolderOpen, FaShieldAlt,
  FaCheckSquare, FaChartBar, FaUsers, FaSignOutAlt, FaBrain, FaRegFileAlt, FaCube
} from 'react-icons/fa'

const ROLE_NAV = {
  Developer: [
    { to: '/developer', label: 'Dashboard', icon: FaHome },
    { to: '/developer/submit-cr', label: 'Submit Request', icon: FaCodeBranch },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  'Project Manager': [
    { to: '/pm', label: 'Dashboard', icon: FaHome },
    { to: '/pm/projects', label: 'Projects', icon: FaFolderOpen },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  'CCB Member': [
    { to: '/ccb', label: 'CCB Board', icon: FaShieldAlt },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  Auditor: [
    { to: '/auditor', label: 'Audits', icon: FaCheckSquare },
    { to: '/auditor/baselines', label: 'Baselines', icon: FaRegFileAlt },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  Admin: [
    { to: '/admin', label: 'Overview', icon: FaHome },
    { to: '/admin/reports', label: 'Reports', icon: FaChartBar },
    { to: '/admin/users', label: 'Users', icon: FaUsers },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const navItems = ROLE_NAV[user.role] || []
  const initials = (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col z-50 font-sans">
      <div className="h-24 flex items-center px-8 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(168,127,243,0.3)]">
            <FaCube size={16} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">IntelliSCM</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-8">
        <div className="text-xs font-semibold text-textMuted/60 uppercase tracking-widest mb-6 ml-4">Workspace</div>
        <ul className="flex flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to.split('/').length <= 2}
                className={({ isActive }) => 
                  `rounded-xl px-4 py-3 flex items-center gap-3 transition-all text-sm font-medium ${
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' 
                      : 'text-textMuted hover:bg-white/[0.03] hover:text-white border border-transparent'
                  }`
                }
              >
                <Icon size={16} className={({isActive}) => isActive ? 'text-primary' : 'text-textMuted/70'} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
            <p className="text-xs text-textMuted truncate mt-0.5">{user.role}</p>
          </div>
        </div>
        <button 
          className="w-full py-2.5 px-4 rounded-xl border border-white/[0.05] bg-white/[0.02] text-sm font-medium text-textMuted hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
