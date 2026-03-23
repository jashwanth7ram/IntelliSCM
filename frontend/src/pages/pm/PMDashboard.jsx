import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { projectsAPI, crsAPI } from '../../services/api'
import { FolderOpen, GitPullRequest, Plus, X, Check } from 'lucide-react'

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
      setMsg('Project created successfully!')
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create project.')
    } finally { setCreating(false) }
  }

  const pending  = crs.filter(c => c.status === 'Pending').length
  const approved = crs.filter(c => c.status === 'Approved').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 Project Manager Dashboard</h1>
        <p className="page-subtitle">Manage projects and monitor change request backlog</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Active Projects', value: projects.length, icon: '📁', color: 'var(--blue)' },
          { label: 'Open CRs',        value: pending,          icon: '⏳', color: 'var(--yellow)' },
          { label: 'Approved CRs',    value: approved,         icon: '✅', color: 'var(--emerald)' },
          { label: 'Total CRs',       value: crs.length,       icon: '📋', color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="glass stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 20 }}>{msg}</div>}

      {isProjectsView ? (
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Projects</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewProject(s => !s)}>
            <Plus size={14} /> New Project
          </button>
        </div>

        {showNewProject && (
          <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>Create New Project</h3>
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input className="form-control" placeholder="e.g. AuthService v2"
                    value={proj.name} onChange={setP('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Repository URL</label>
                  <input className="form-control" placeholder="https://github.com/org/repo"
                    value={proj.repository} onChange={setP('repository')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" style={{ minHeight: 70 }}
                  placeholder="What does this project do?"
                  value={proj.description} onChange={setP('description')} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                  {creating ? 'Creating…' : <><Check size={14} /> Create</>}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewProject(false)}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="glass">
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : projects.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No projects yet. Create one above.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Description</th><th>Repository</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600, color: 'var(--emerald)' }}>{p.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.description || '—'}</td>
                      <td>
                        {p.repository
                          ? <a href={p.repository} target="_blank" rel="noreferrer"
                              style={{ color: 'var(--blue)', fontSize: 12 }}>View Repo</a>
                          : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="section">
        <div className="section-header"><h2 className="section-title">Change Request Backlog</h2></div>
        <div className="glass">
          {crs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No change requests found.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Title</th><th>Priority</th><th>Risk</th><th>Status</th><th>Submitted</th></tr>
                </thead>
                <tbody>
                  {crs.slice(0, 20).map(cr => (
                    <tr key={cr._id}>
                      <td style={{ fontWeight: 500 }}>{cr.title}</td>
                      <td>{cr.priority}</td>
                      <td>
                        <span className={`badge badge-${(cr.riskScore || 'Low').toLowerCase()}`}>{cr.riskScore || 'Low'}</span>
                      </td>
                      <td><span className={`badge badge-${cr.status === 'Approved' ? 'approved' : cr.status === 'Rejected' ? 'rejected' : 'pending'}`}>{cr.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
