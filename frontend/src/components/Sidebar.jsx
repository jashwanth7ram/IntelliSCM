import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../services/api'
import {
  FaHome, FaCodeBranch, FaFolderOpen, FaShieldAlt,
  FaCheckSquare, FaChartBar, FaUsers, FaSignOutAlt,
  FaBrain, FaRegFileAlt, FaCube, FaLayerGroup, FaBell
} from 'react-icons/fa'

const ROLE_NAV = {
  Developer: [
    { to: '/developer',           label: 'Dashboard',   icon: FaHome },
    { to: '/developer/submit-cr', label: 'Submit CR',   icon: FaCodeBranch },
    { to: '/ml-insights',         label: 'ML Insights', icon: FaBrain },
  ],
  'Project Manager': [
    { to: '/pm',          label: 'Dashboard',   icon: FaHome },
    { to: '/pm/projects', label: 'Projects',    icon: FaFolderOpen },
    { to: '/ci-registry', label: 'CI Registry', icon: FaLayerGroup },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  'CCB Member': [
    { to: '/ccb',         label: 'CCB Board',   icon: FaShieldAlt },
    { to: '/ml-insights', label: 'ML Insights', icon: FaBrain },
  ],
  Auditor: [
    { to: '/auditor',           label: 'Audit Dashboard', icon: FaCheckSquare },
    { to: '/auditor/baselines', label: 'Baselines',       icon: FaRegFileAlt },
    { to: '/ci-registry',       label: 'CI Registry',     icon: FaLayerGroup },
  ],
  Admin: [
    { to: '/admin',         label: 'Overview', icon: FaHome },
    { to: '/admin/reports', label: 'Reports',  icon: FaChartBar },
    { to: '/admin/users',   label: 'Users',    icon: FaUsers },
  ],
}

const TYPE_COLORS = {
  AUDIT_SCHEDULED: 'bg-blue-500',
  CR_APPROVED:     'bg-emerald-500',
  CR_REJECTED:     'bg-red-500',
  BASELINE_CREATED:'bg-purple-500',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [notifs, setNotifs]       = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef(null)

  const fetchNotifs = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifs(res.data || [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!user) return
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000) // poll every 30s
    return () => clearInterval(id)
  }, [user])

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.isRead)
    await Promise.allSettled(unread.map(n => notificationsAPI.markRead(n._id)))
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  if (!user) return null

  const navItems  = ROLE_NAV[user.role] || []
  const initials  = (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const unreadCnt = notifs.filter(n => !n.isRead).length

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col z-50 font-sans">

      {/* Logo + bell */}
      <div className="h-24 flex items-center justify-between px-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(168,127,243,0.3)]">
            <FaCube size={16} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">IntelliSCM</h1>
        </div>

        {/* Bell button */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowPanel(s => !s)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-textMuted hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <FaBell size={15} />
            {unreadCnt > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg">
                {unreadCnt > 9 ? '9+' : unreadCnt}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {showPanel && (
            <div className="absolute left-full top-0 ml-3 w-80 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-[100] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCnt > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:text-primaryHover transition-colors font-medium">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <FaBell size={22} className="text-white/10 mb-3" />
                    <p className="text-xs text-white/30 text-center">You're all caught up. No notifications yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.04]">
                    {notifs.map(n => (
                      <li
                        key={n._id}
                        onClick={() => !n.isRead && markRead(n._id)}
                        className={`px-5 py-4 flex gap-3 items-start cursor-pointer transition-colors ${n.isRead ? 'opacity-50' : 'hover:bg-white/[0.04]'}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[n.type] || 'bg-zinc-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-zinc-500 mt-1.5">
                            {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
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
                <Icon size={16} className="text-current opacity-80" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
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
