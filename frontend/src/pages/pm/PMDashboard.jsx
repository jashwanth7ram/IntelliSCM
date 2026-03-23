import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { projectsAPI, crsAPI } from '../../services/api'
import { FaFolderOpen, FaCodeBranch, FaPlus, FaTimes, FaArrowRight } from 'react-icons/fa'

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
      setMsg('Project created successfully')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create project.')
    } finally { setCreating(false) }
  }

  const pending  = crs.filter(c => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review').length
  const approved = crs.filter(c => c.status === 'Approved').length

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          PROJECT<br/><span className="text-primary">MANAGER</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Manage projects and monitor CR backlog.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Active Projects', value: projects.length, num: '01' },
          { label: 'Open CRs',        value: pending,         num: '02' },
          { label: 'Approved CRs',    value: approved,        num: '03' },
          { label: 'Total CRs',       value: crs.length,      num: '04' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:bg-[#161616] transition-colors relative group">
            <div className="text-primary font-bold text-sm mb-8 bg-primary/10 w-fit px-2 py-1 rounded inline-block">{s.num}</div>
            <div className="text-6xl font-black text-white mb-4">{s.value}</div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            <FaArrowRight className="absolute top-8 right-8 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {msg && <div className="bg-primary/20 border border-primary text-white px-6 py-4 rounded-lg mb-8 text-sm font-bold tracking-wide uppercase">{msg}</div>}

      {isProjectsView ? (
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">OUR PROJECTS</h2>
          <button className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all text-xs flex items-center gap-2" 
            onClick={() => setShowNewProject(s => !s)}>
            <FaPlus size={12} /> New Project
          </button>
        </div>

        {showNewProject && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">INITIATE PROJECT</h3>
            <form onSubmit={createProject} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Project Name</label>
                  <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                    placeholder="AUTH SERVICE V2" value={proj.name} onChange={setP('name')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Repository URL</label>
                  <input type="url" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                    placeholder="HTTPS://GITHUB.COM/ORG/REPO" value={proj.repository} onChange={setP('repository')} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <textarea className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm min-h-[120px] placeholder-zinc-700 leading-relaxed" 
                  placeholder="WHAT DOES THIS PROJECT DO?" value={proj.description} onChange={setP('description')} />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-10 py-4 rounded-lg transition-all text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Launch Project'}
                </button>
                <button type="button" className="bg-transparent border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg transition-all text-xs" 
                  onClick={() => setShowNewProject(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-32 px-6">
                <span className="loading loading-spinner text-primary loading-lg"></span>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-6 text-zinc-600">
                <FaFolderOpen size={48} className="opacity-20 mb-6" />
                <p className="text-sm font-bold uppercase tracking-widest">No projects found.</p>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5">Description</th>
                    <th className="px-8 py-5">Repository</th>
                    <th className="px-8 py-5">Created</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {projects.map(p => (
                    <tr key={p._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                      <td className="px-8 py-5 font-bold text-white">{p.name}</td>
                      <td className="px-8 py-5 font-medium text-zinc-400 max-w-[300px] truncate">{p.description || '—'}</td>
                      <td className="px-8 py-5">
                        {p.repository
                          ? <a href={p.repository} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xs uppercase tracking-wider">Source</a>
                          : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-8 py-5 text-zinc-600 text-xs font-mono">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
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
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">CR BACKLOG</h2>
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {crs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-6 text-zinc-600">
                <p className="text-sm font-bold uppercase tracking-widest">No change requests found.</p>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <th className="px-8 py-5">Title</th>
                    <th className="px-8 py-5">Priority</th>
                    <th className="px-8 py-5">Risk</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Submitted</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {crs.slice(0, 20).map(cr => (
                    <tr key={cr._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                      <td className="px-8 py-5 font-bold text-white max-w-[250px] truncate">{cr.title}</td>
                      <td className="px-8 py-5 font-medium text-zinc-300">{cr.priority}</td>
                      <td className="px-8 py-5">
                        <span className={`text-xs font-bold px-3 py-1 rounded ${cr.riskScore === 'High' ? 'text-[#050505] bg-primary' : cr.riskScore === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                          {cr.riskScore || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-xs font-bold uppercase tracking-wider ${cr.status === 'Approved' ? 'text-emerald-500' : cr.status === 'Rejected' ? 'text-zinc-500' : 'text-primary'}`}>
                          {cr.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-zinc-600 text-xs font-mono">
                        {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : '—'}
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
