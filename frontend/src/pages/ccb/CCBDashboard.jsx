import { useEffect, useState } from 'react'
import { crsAPI, ccbAPI } from '../../services/api'
import { Shield, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

const DECISIONS = ['Approved', 'Rejected', 'Request Modification']

export default function CCBDashboard() {
  const [crs, setCrs]           = useState([])
  const [loading, setLoading]   = useState(true)
  const [deciding, setDeciding] = useState({})
  const [comments, setComments] = useState({})
  const [decision, setDecision] = useState({})
  const [msg, setMsg]           = useState('')

  useEffect(() => {
    crsAPI.list().then(r => { setCrs(r.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const pendingCrs = crs.filter(c => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review')

  const submitDecision = async (crId) => {
    if (!decision[crId]) return
    setDeciding(d => ({ ...d, [crId]: true }))
    try {
      await ccbAPI.decide({
        crId,
        decision: decision[crId],
        comments: comments[crId] || '',
      })
      setCrs(prev => prev.map(c =>
        c._id === crId ? { ...c, status: decision[crId] } : c
      ))
      setMsg(`Decision submitted: ${decision[crId]}`)
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to submit decision.')
    } finally { setDeciding(d => ({ ...d, [crId]: false })) }
  }

  const approved = crs.filter(c => c.status === 'Approved').length
  const rejected = crs.filter(c => c.status === 'Rejected').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">🛡️ CCB Dashboard</h1>
        <p className="page-subtitle">Review and decide on pending change requests</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending Review', value: pendingCrs.length, icon: '⏳', color: 'var(--yellow)' },
          { label: 'Approved',       value: approved,           icon: '✅', color: 'var(--emerald)' },
          { label: 'Rejected',       value: rejected,           icon: '❌', color: 'var(--red)' },
          { label: 'Total CRs',      value: crs.length,         icon: '📋', color: 'var(--blue)' },
        ].map(s => (
          <div key={s.label} className="glass stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 20 }}>{msg}</div>}

      {/* Pending CRs */}
      <div className="section">
        <div className="section-header"><h2 className="section-title">Pending Decisions</h2></div>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : pendingCrs.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No pending change requests. All caught up! 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingCrs.map(cr => (
              <div key={cr._id} className="glass" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{cr.title}</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-pending">{cr.changeType}</span>
                      <span className={`badge badge-${(cr.priority || '').toLowerCase() === 'critical' ? 'critical' : (cr.priority || '').toLowerCase() === 'high' ? 'high' : 'medium'}`}>
                        {cr.priority}
                      </span>
                      <span className={`badge badge-${(cr.riskScore || 'Low').toLowerCase()}`}>
                        Risk: {cr.riskScore || 'Low'}
                      </span>
                      {cr.impactLevel && <span className="badge badge-medium">Impact: {cr.impactLevel}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  {cr.description}
                </p>

                {cr.affectedComponents?.length > 0 && (
                  <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    <strong>Affected:</strong> {cr.affectedComponents.join(', ')}
                  </div>
                )}

                {/* Decision Controls */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                    <label className="form-label">Decision</label>
                    <select className="form-control"
                      value={decision[cr._id] || ''}
                      onChange={e => setDecision(d => ({ ...d, [cr._id]: e.target.value }))}>
                      <option value="">— Select —</option>
                      {DECISIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                    <label className="form-label">Comments</label>
                    <input className="form-control" placeholder="Optional review comments…"
                      value={comments[cr._id] || ''}
                      onChange={e => setComments(c => ({ ...c, [cr._id]: e.target.value }))} />
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!decision[cr._id] || deciding[cr._id]}
                    onClick={() => submitDecision(cr._id)}
                    style={{ marginBottom: 1 }}>
                    {deciding[cr._id] ? 'Submitting…' : <><CheckCircle size={14} /> Submit</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All CRs history */}
      <div className="section">
        <div className="section-header"><h2 className="section-title">Decision History</h2></div>
        <div className="glass">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Type</th><th>Risk</th><th>Priority</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {crs.filter(c => c.status !== 'Pending' && c.status !== 'Submitted' && c.status !== 'Under Review').map(cr => (
                  <tr key={cr._id}>
                    <td style={{ fontWeight: 500 }}>{cr.title}</td>
                    <td><span className="badge badge-pending">{cr.changeType}</span></td>
                    <td><span className={`badge badge-${(cr.riskScore || '').toLowerCase()}`}>{cr.riskScore}</span></td>
                    <td>{cr.priority}</td>
                    <td><span className={`badge badge-${cr.status === 'Approved' ? 'approved' : 'rejected'}`}>{cr.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
