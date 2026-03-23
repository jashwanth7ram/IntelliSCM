import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaHome, FaCodeBranch, FaFolderOpen, FaShieldAlt,
  FaCheckSquare, FaChartBar, FaUsers, FaSignOutAlt, FaBrain, FaRegFileAlt
} from 'react-icons/fa'

const ROLE_NAV = {
  Developer: [
    { to: '/developer', label: 'Dashboard', icon: FaHome },
    { to: '/developer/submit-cr', label: 'Submit CR', icon: FaCodeBranch },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  'Project Manager': [
    { to: '/pm', label: 'Dashboard', icon: FaHome },
    { to: '/pm/projects', label: 'Projects', icon: FaFolderOpen },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  'CCB Member': [
    { to: '/ccb', label: 'CCB Dashboard', icon: FaShieldAlt },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  Auditor: [
    { to: '/auditor', label: 'Audit Dashboard', icon: FaCheckSquare },
    { to: '/auditor/baselines', label: 'Baselines', icon: FaRegFileAlt },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  Admin: [
    { to: '/admin', label: 'Dashboard', icon: FaHome },
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#050505] border-r border-[#1a1a1a] flex flex-col z-50 font-sans">
      <div className="h-24 flex items-center px-8 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase"><span className="text-primary">INTELLI</span>SCM</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-8">
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6 ml-4">Menu</div>
        <ul className="flex flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to.split('/').length <= 2}
                className={({ isActive }) => 
                  `rounded-md px-4 py-3 flex items-center gap-4 transition-colors text-xs font-bold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-zinc-500 hover:bg-[#111111] hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-[#1a1a1a] bg-[#050505]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate max-w-[140px]">{user.name || 'User'}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate max-w-[140px] mt-0.5">{user.role}</p>
          </div>
        </div>
        <button 
          className="w-full py-3 px-4 rounded-md border border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt size={12} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
