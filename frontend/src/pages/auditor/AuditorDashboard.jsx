import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI } from '../../services/api'
import { CheckSquare, Plus, X, Check, FileText } from 'lucide-react'

const AUDIT_TYPES = ['FCA', 'PCA']

export default function AuditorDashboard() {
  const location = useLocation()
  const isBaselinesView = location.pathname === '/auditor/baselines'
  
  const [crs, setCrs]         = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  // Baseline form
  const [showBaseline, setShowBaseline] = useState(false)
  const [baseline, setBaseline] = useState({ version: '', description: '', project: '' })
  const [bLoading, setBLoading] = useState(false)

  // Audit form
  const [showAudit, setShowAudit] = useState(false)
  const [audit, setAudit] = useState({ auditType: 'FCA', scheduledDate: '', notes: '' })
  const [aLoading, setALoading] = useState(false)

  useEffect(() => {
    crsAPI.list().then(r => { setCrs(r.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const setB = (k) => (e) => setBaseline(x => ({ ...x, [k]: e.target.value }))
  const setA = (k) => (e) => setAudit(x => ({ ...x, [k]: e.target.value }))

  const createBaseline = async (e) => {
    e.preventDefault(); setBLoading(true); setMsg('')
    try {
      await baselinesAPI.create(baseline)
      setMsg('✅ Baseline created successfully!')
      setShowBaseline(false)
      setBaseline({ version: '', description: '', project: '' })
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create baseline.')
    } finally { setBLoading(false) }
    setTimeout(() => setMsg(''), 4000)
  }

  const scheduleAudit = async (e) => {
    e.preventDefault(); setALoading(true); setMsg('')
    try {
      await auditsAPI.create(audit)
      setMsg('✅ Audit scheduled successfully!')
      setShowAudit(false)
      setAudit({ auditType: 'FCA', scheduledDate: '', notes: '' })
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to schedule audit.')
    } finally { setALoading(false) }
    setTimeout(() => setMsg(''), 4000)
  }

  const approved = crs.filter(c => c.status === 'Approved').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 Auditor Dashboard</h1>
        <p className="page-subtitle">Manage baselines, schedule FCA/PCA audits, and review approval trail</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Approved CRs',  value: approved,   icon: '✅', color: 'var(--emerald)' },
          { label: 'Total CRs',     value: crs.length, icon: '📋', color: 'var(--blue)' },
          { label: 'Pending Review', value: crs.filter(c=>c.status==='Pending').length, icon: '⏳', color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="glass stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 20 }}>{msg}</div>}

      {/* Actions */}
      {isBaselinesView ? (
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Audit Actions</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowBaseline(s=>!s); setShowAudit(false) }}>
              <FileText size={14} /> Create Baseline
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowAudit(s=>!s); setShowBaseline(false) }}>
              <CheckSquare size={14} /> Schedule Audit
            </button>
          </div>
        </div>

        {/* Baseline Form */}
        {showBaseline && (
          <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Create Version Baseline</h3>
            <form onSubmit={createBaseline} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Version Tag *</label>
                  <input className="form-control" placeholder="e.g. v1.4.2"
                    value={baseline.version} onChange={setB('version')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Project ID</label>
                  <input className="form-control" placeholder="Project identifier"
                    value={baseline.project} onChange={setB('project')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" style={{ minHeight: 70 }}
                  placeholder="What does this baseline represent?"
                  value={baseline.description} onChange={setB('description')} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={bLoading}>
                  {bLoading ? 'Creating…' : <><Check size={14}/> Create Baseline</>}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBaseline(false)}>
                  <X size={14}/> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Form */}
        {showAudit && (
          <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Schedule Audit</h3>
            <form onSubmit={scheduleAudit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Audit Type</label>
                  <select className="form-control" value={audit.auditType} onChange={setA('auditType')}>
                    {AUDIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled Date *</label>
                  <input type="date" className="form-control"
                    value={audit.scheduledDate} onChange={setA('scheduledDate')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" style={{ minHeight: 70 }}
                  placeholder="Audit scope and objectives…"
                  value={audit.notes} onChange={setA('notes')} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={aLoading}>
                  {aLoading ? 'Scheduling…' : <><Check size={14}/> Schedule Audit</>}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAudit(false)}>
                  <X size={14}/> Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      ) : (
      <div className="section">
        <div className="section-header"><h2 className="section-title">Approved Change Audit Trail</h2></div>
        <div className="glass">
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>CR Title</th><th>Type</th><th>Priority</th><th>Risk</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {crs.filter(c => c.status === 'Approved').map(cr => (
                    <tr key={cr._id}>
                      <td style={{ fontWeight: 500 }}>{cr.title}</td>
                      <td><span className="badge badge-pending">{cr.changeType}</span></td>
                      <td>{cr.priority}</td>
                      <td><span className={`badge badge-${(cr.riskScore||'Low').toLowerCase()}`}>{cr.riskScore||'Low'}</span></td>
                      <td><span className="badge badge-approved">Approved</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {crs.filter(c => c.status === 'Approved').length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No approved CRs yet.</td></tr>
                  )}
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
