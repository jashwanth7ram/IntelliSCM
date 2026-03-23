import { useEffect, useState } from 'react'
import { crsAPI } from '../../services/api'
import { GitPullRequest, Clock, CheckCircle, XCircle, AlertTriangle, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const RISK_CLASS = { High: 'high', Medium: 'medium', Low: 'low' }
const STATUS_CLASS = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', 'Request Modification': 'medium' }

export default function DeveloperDashboard() {
  const { user } = useAuth()
  const [crs, setCrs]         = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    crsAPI.list().then(r => { setCrs(r.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const myCrs   = crs.filter(c => {
    const userId = user?.id || user?._id;
    const submittedId = typeof c.submittedBy === 'object' ? c.submittedBy?._id : c.submittedBy;
    return submittedId?.toString() === userId?.toString();
  });
  const pending  = myCrs.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Pending').length
  const approved = myCrs.filter(c => c.status === 'Approved').length
  const rejected = myCrs.filter(c => c.status === 'Rejected').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">👨‍💻 Developer Dashboard</h1>
        <p className="page-subtitle">Track your change requests and code risk analysis</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total CRs',  value: myCrs.length, icon: '📋', color: 'var(--blue)' },
          { label: 'Pending',    value: pending,       icon: '⏳', color: 'var(--yellow)' },
          { label: 'Approved',   value: approved,      icon: '✅', color: 'var(--emerald)' },
          { label: 'Rejected',   value: rejected,      icon: '❌', color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="glass stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header"><h2 className="section-title">Quick Actions</h2></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/developer/submit-cr" className="btn btn-primary">
            <GitPullRequest size={16} /> Submit Change Request
          </Link>
          <Link to="/ml-insights" className="btn btn-secondary">
            <Cpu size={16} /> ML Risk Analysis
          </Link>
        </div>
      </div>

      {/* My Change Requests */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">My Change Requests</h2>
        </div>
        <div className="glass">
          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Loading CRs…</p></div>
          ) : myCrs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <GitPullRequest size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No change requests yet. Submit your first one!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Type</th><th>Priority</th>
                    <th>Risk Score</th><th>Status</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myCrs.map(cr => (
                    <tr key={cr._id}>
                      <td style={{ fontWeight: 500 }}>{cr.title}</td>
                      <td><span className="badge badge-pending">{cr.changeType}</span></td>
                      <td>{cr.priority}</td>
                      <td>
                        <span className={`badge badge-${RISK_CLASS[cr.riskScore] || 'low'}`}>
                          {cr.riskScore || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${STATUS_CLASS[cr.status] || 'pending'}`}>
                          {cr.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
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
    </div>
  )
}
