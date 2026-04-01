import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { projectsAPI, crsAPI } from '../../services/api'
import { FaFolderOpen, FaArrowRight, FaPlus } from 'react-icons/fa'

export default function PMDashboard() {
  const location = useLocation()
  const isProjectsView = location.pathname === '/pm/projects'
  
  const [projects, setProjects] = useState([])
  const [crs, setCrs]           = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [proj, setProj] = useState({ name: '', description: '', repository: '' })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([projectsAPI.list(), crsAPI.list()])
      .then(([p, c]) => { setProjects(p.data || []); setCrs(c.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const setP = (k) => (e) => setProj(x => ({ ...x, [k]: e.target.value }))

  const createProject = async (e) => {
    e.preventDefault(); setCreating(true); setMsg('')
    try {
      const r = await projectsAPI.create(proj)
      setProjects(p => [...p, r.data])
      setShowNewProject(false); setProj({ name: '', description: '', repository: '' })
      setMsg('Project provisioned successfully')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create project.')
    } finally { setCreating(false) }
  }

  const pending  = crs.filter(c => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review').length
  const approved = crs.filter(c => c.status === 'Approved').length

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-12 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          Project Manager
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Orchestrate organizational portfolios and monitor change request backlogs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Active Projects', value: projects.length },
          { label: 'Open CRs',        value: pending },
          { label: 'Approved CRs',    value: approved },
          { label: 'Total CRs',       value: crs.length },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative group">
            <div className="text-4xl font-black text-white tracking-tight mb-2">{s.value}</div>
            <div className="text-sm font-medium text-textMuted">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>{msg}</div>}

      {isProjectsView ? (
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Portfolios</h2>
          <button className="bg-primary hover:bg-primaryHover text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(168,127,243,0.3)]" 
            onClick={() => setShowNewProject(s => !s)}>
            <FaPlus size={12} /> Init Project
          </button>
        </div>

        {showNewProject && (
          <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <h3 className="text-xl font-bold text-white tracking-tight mb-6">Initialize New Project</h3>
            <form onSubmit={createProject} className="flex flex-col gap-6 relative z-10 w-full lg:max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project Name</label>
                  <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner" 
                    placeholder="e.g. Identity Service" value={proj.name} onChange={setP('name')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Repository URL</label>
                  <input type="url" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner" 
                    placeholder="https://github.com/..." value={proj.repository} onChange={setP('repository')} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description</label>
                <textarea className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm min-h-[100px] placeholder-zinc-700 shadow-inner resize-y" 
                  placeholder="Define the scope of the project..." value={proj.description} onChange={setP('description')} />
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]" disabled={creating}>
                  {creating ? 'Saving...' : 'Deploy Project'}
                </button>
                <button type="button" className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm" 
                  onClick={() => setShowNewProject(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20 px-6">
                <span className="loading loading-spinner text-primary loading-lg"></span>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-zinc-600">
                <FaFolderOpen size={32} className="opacity-40 mb-4" />
                <p className="text-sm font-medium text-white/50">No active projects found.</p>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Repository</th>
                    <th className="px-6 py-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {projects.map(p => (
                    <tr key={p._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                      <td className="px-6 py-4 text-textMuted max-w-[300px] truncate">{p.description || '—'}</td>
                      <td className="px-6 py-4">
                        {p.repository
                          ? <a href={p.repository} target="_blank" rel="noreferrer" className="text-primary hover:text-white transition-colors font-medium hover:underline text-sm flex items-center gap-1.5"><FaFolderOpen size={12}/> Repository</a>
                          : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-textMuted">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      ) : (
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">CR Backlog</h2>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {crs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-zinc-600">
                <p className="text-sm font-medium text-white/50">No change requests in the backlog.</p>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {crs.slice(0, 20).map(cr => (
                    <tr key={cr._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold text-white max-w-[250px] truncate">{cr.title}</td>
                      <td className="px-6 py-4 font-medium text-zinc-300">{cr.priorityLevel || 'Medium'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cr.riskScore === 'High' ? 'text-red-400 bg-red-400/10 border border-red-400/20' : cr.riskScore === 'Medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cr.riskScore === 'High' ? 'bg-red-400' : cr.riskScore === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          {cr.riskScore || 'Low'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cr.status === 'Approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : cr.status === 'Rejected' ? 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5' : 'text-primary border-primary/20 bg-primary/5'}`}>
                          {cr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textMuted text-right">
                        {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
