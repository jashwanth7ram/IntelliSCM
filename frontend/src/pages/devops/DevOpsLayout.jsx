import { NavLink, Outlet } from 'react-router-dom'
import { FaChartLine, FaProjectDiagram, FaRocket, FaServer } from 'react-icons/fa'

const tabCls = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
    isActive
      ? 'bg-primary/10 text-primary border border-primary/20'
      : 'bg-white/[0.02] border border-white/[0.06] text-textMuted hover:text-white hover:bg-white/[0.05]'
  }`

export default function DevOpsLayout() {
  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-8 pt-8">
        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">DevOps</h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Pipelines, releases, environments, and delivery metrics aligned with modern SCM tooling.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 mb-8">
        <NavLink to="/devops" end className={tabCls}>
          <FaChartLine size={14} /> Metrics
        </NavLink>
        <NavLink to="/devops/pipelines" className={tabCls}>
          <FaProjectDiagram size={14} /> Pipelines
        </NavLink>
        <NavLink to="/devops/releases" className={tabCls}>
          <FaRocket size={14} /> Releases
        </NavLink>
        <NavLink to="/devops/environments" className={tabCls}>
          <FaServer size={14} /> Environments
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
