import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { crsAPI, reportsAPI, usersAPI } from '../../services/api'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { BarChart3, Users, TrendingUp, AlertTriangle } from 'lucide-react'

const COLORS = ['#00C896', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a', border: '1px solid rgba(0,200,150,0.2)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13,
}

export default function AdminDashboard() {
  const location = useLocation()
  const isReportsView = location.pathname === '/admin/reports'
  const isUsersView = location.pathname === '/admin/users'
  
  const [crs, setCrs]           = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      crsAPI.list(),
      usersAPI.list()
    ])
    .then(([crsRes, usersRes]) => {
      setCrs(crsRes.data || [])
      setUsers(usersRes.data || [])
    })
    .catch(err => console.error("Error loading admin data:", err))
    .finally(() => setLoading(false))
  }, [])

  // ── Data derivations
  const byStatus = [
    { name: 'Pending',  value: crs.filter(c => c.status === 'Pending').length },
    { name: 'Approved', value: crs.filter(c => c.status === 'Approved').length },
    { name: 'Rejected', value: crs.filter(c => c.status === 'Rejected').length },
    { name: 'Modified', value: crs.filter(c => c.status === 'Request Modification').length },
  ]

  const byRisk = [
    { name: 'Low',    value: crs.filter(c => c.riskScore === 'Low').length,    fill: '#00C896' },
    { name: 'Medium', value: crs.filter(c => c.riskScore === 'Medium').length, fill: '#f59e0b' },
    { name: 'High',   value: crs.filter(c => c.riskScore === 'High').length,   fill: '#ef4444' },
  ]

  const byType = ['Feature','Bug Fix','Refactor','Security','Performance','Infrastructure'].map(t => ({
    name: t, count: crs.filter(c => c.changeType === t).length
  }))

  const byPriority = ['Low','Medium','High','Critical'].map(p => ({
    name: p, count: crs.filter(c => c.priority === p).length
  }))

  // Monthly trend — group by createdAt YYYY-MM
  const monthly = {}
  crs.forEach(cr => {
    if (!cr.createdAt) return
    const m = new Date(cr.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' })
    if (!monthly[m]) monthly[m] = { month: m, submitted: 0, approved: 0 }
    monthly[m].submitted++
    if (cr.status === 'Approved') monthly[m].approved++
  })
  const trend = Object.values(monthly).slice(-8)

  const highRisk = crs.filter(c => c.riskScore === 'High').length
  const approvalRate = crs.length > 0
    ? Math.round((crs.filter(c=>c.status==='Approved').length / crs.length) * 100)
    : 0

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">⚡ Admin Dashboard</h1>
        <p className="page-subtitle">System-wide analytics, reporting, and configuration management insights</p>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total CRs',     value: crs.length, icon: '📋', color: 'var(--blue)' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: '✅', color: 'var(--emerald)' },
          { label: 'High Risk CRs', value: highRisk, icon: '🔴', color: 'var(--red)' },
          { label: 'Pending',       value: crs.filter(c=>c.status==='Pending').length, icon: '⏳', color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="glass stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading reports…</p></div>
      ) : (
        <>
          {isReportsView ? (
          <div>
          {/* Row 1: Trend Line + Status Pie */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>📈 Monthly CR Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2} dot={false} name="Submitted"/>
                  <Line type="monotone" dataKey="approved"  stroke="#00C896" strokeWidth={2} dot={false} name="Approved"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>🍩 CR Status Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Bar Charts */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>⚠️ Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byRisk} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="CRs" radius={[4,4,0,0]}>
                    {byRisk.map((r, i) => <Cell key={i} fill={r.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>🏷️ Changes by Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byType} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={40}/>
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Count"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
          ) : isUsersView ? (
          <div className="section">
            <div className="section-header"><h2 className="section-title">👥 System Users</h2></div>
            <div className="glass">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td><span className={`badge badge-pending`}>{u.role}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ) : (
          <div>
          {/* High Risk CRs Alert */}
          {highRisk > 0 && (
            <div className="section">
              <div className="section-header"><h2 className="section-title">🔴 High Risk Change Requests</h2></div>
              <div className="glass">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Type</th><th>Priority</th><th>Impact</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {crs.filter(c => c.riskScore === 'High').map(cr => (
                        <tr key={cr._id}>
                          <td style={{ fontWeight: 600 }}>{cr.title}</td>
                          <td><span className="badge badge-pending">{cr.changeType}</span></td>
                          <td><span style={{ color: 'var(--red)', fontWeight: 600 }}>{cr.priority}</span></td>
                          <td><span className="badge badge-critical">{cr.impactLevel || '—'}</span></td>
                          <td><span className={`badge badge-${cr.status === 'Approved' ? 'approved' : cr.status === 'Rejected' ? 'rejected' : 'pending'}`}>{cr.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>
          )}
        </>
      )}
    </div>
  )
}
