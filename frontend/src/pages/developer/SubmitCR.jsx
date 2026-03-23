import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { crsAPI, projectsAPI } from '../../services/api'
import { Send, AlertCircle } from 'lucide-react'

const CHANGE_TYPES  = ['Feature', 'Bug Fix', 'Refactor', 'Security', 'Performance', 'Documentation', 'Infrastructure']
const PRIORITIES    = ['Low', 'Medium', 'High', 'Critical']
const ENVIRONMENTS  = ['Development', 'Staging', 'Production']

export default function SubmitCR() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', changeType: 'Feature', priority: 'Medium',
    project: '', affectedComponents: '', targetEnvironment: 'Development',
    linesOfCode: '', testingPlan: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    projectsAPI.list().then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      await crsAPI.create({
        ...form,
        linesOfCode: parseInt(form.linesOfCode) || 0,
        affectedComponents: form.affectedComponents.split(',').map(s => s.trim()).filter(Boolean),
      })
      setSuccess(true)
      setTimeout(() => navigate('/developer'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit change request.')
    } finally { setSubmitting(false) }
  }

  if (success) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: 'var(--emerald)', marginBottom: 8 }}>Change Request Submitted!</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard…</p>
    </div>
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Submit Change Request</h1>
        <p className="page-subtitle">Fill in the details below — AI will assess risk automatically</p>
      </div>

      <div className="glass" style={{ padding: '32px', maxWidth: 760 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><AlertCircle size={15} style={{ marginRight: 8 }} />{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CR Title *</label>
              <input type="text" className="form-control" placeholder="e.g. Add OAuth2 login"
                value={form.title} onChange={set('title')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-control" value={form.project} onChange={set('project')}>
                <option value="">— Select project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" placeholder="Describe what changes you're proposing and why…"
              value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Change Type</label>
              <select className="form-control" value={form.changeType} onChange={set('changeType')}>
                {CHANGE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Environment</label>
              <select className="form-control" value={form.targetEnvironment} onChange={set('targetEnvironment')}>
                {ENVIRONMENTS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Estimated Lines of Code</label>
              <input type="number" className="form-control" placeholder="e.g. 250"
                value={form.linesOfCode} onChange={set('linesOfCode')} min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">Affected Components (comma-separated)</label>
              <input type="text" className="form-control" placeholder="e.g. auth-service, user-api"
                value={form.affectedComponents} onChange={set('affectedComponents')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Testing Plan</label>
            <textarea className="form-control" style={{ minHeight: 80 }}
              placeholder="Describe how this change will be tested…"
              value={form.testingPlan} onChange={set('testingPlan')} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Submitting…' : 'Submit Change Request'}
            </button>
            <button type="button" className="btn btn-secondary"
              onClick={() => navigate('/developer')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
