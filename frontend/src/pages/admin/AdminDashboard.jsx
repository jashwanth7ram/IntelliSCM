import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { crsAPI, reportsAPI, usersAPI } from '../../services/api'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { FaArrowRight } from 'react-icons/fa'

const COLORS = ['#2D68FF', '#FF7E2D', '#f59e0b', '#ef4444', '#10b981']

const TOOLTIP_STYLE = {
  backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, color: '#e2e8f0', fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
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
    { name: 'Low',    value: crs.filter(c => c.riskScore === 'Low').length,    fill: '#10b981' },
    { name: 'Medium', value: crs.filter(c => c.riskScore === 'Medium').length, fill: '#f59e0b' },
    { name: 'High',   value: crs.filter(c => c.riskScore === 'High').length,   fill: '#ef4444' },
  ]

  const byType = ['Feature','Bug Fix','Refactor','Security','Performance','Infrastructure'].map(t => ({
    name: t, count: crs.filter(c => c.changeType === t).length
  }))

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
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-12 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          System Overview
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Monitor universal application telemetry, access control, and deployment patterns.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total CRs',     value: crs.length },
          { label: 'Approval Rate', value: `${approvalRate}%` },
          { label: 'High Risk CRs', value: highRisk },
          { label: 'Pending',       value: crs.filter(c=>c.status==='Pending').length },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative group">
            <div className={`text-4xl font-black tracking-tight mb-2 ${s.label === 'High Risk CRs' && s.value > 0 ? 'text-red-400' : 'text-white'}`}>{s.value}</div>
            <div className="text-sm font-medium text-textMuted">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 px-6">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <>
          {isReportsView ? (
          <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white tracking-tight mb-8">Monthly Operations Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#999', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="submitted" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111' }} activeDot={{ r: 6 }} name="Requests"/>
                  <Line type="monotone" dataKey="approved"  stroke="#2D68FF" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111' }} activeDot={{ r: 6 }} name="Approvals"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white tracking-tight mb-8">Request Status Allocation</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} stroke="none">
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white tracking-tight mb-8">System AI Risk Analysis</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byRisk} barSize={40} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="value" name="Detected Constraints" radius={[8,8,0,0]}>
                    {byRisk.map((r, i) => <Cell key={i} fill={r.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white tracking-tight mb-8">Operation Types Filter</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byType} barSize={32} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 10, fontWeight: 500 }} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" fill="#2D68FF" radius={[8,8,0,0]} name="Volume"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
          ) : isUsersView ? (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">User Telemetry</h2>
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
              <div className="p-0 overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Identity Envelope</th>
                      <th className="px-6 py-4">Access Level</th>
                      <th className="px-6 py-4 text-right">Provisioned On</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                        <td className="px-6 py-4 text-textMuted">{u.email}</td>
                        <td className="px-6 py-4"><span className="text-xs font-medium px-2.5 py-1 rounded border border-white/[0.1] bg-white/[0.02] text-zinc-300">{u.role}</span></td>
                        <td className="px-6 py-4 text-textMuted text-right">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ) : (
          <div>
          {/* High Risk CRs Alert */}
          {highRisk > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                Critical Priority Overrides
              </h2>
              <div className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="p-0 overflow-x-auto">
                  <table className="w-full whitespace-nowrap text-left">
                    <thead>
                      <tr className="border-b border-red-500/20 text-xs font-semibold text-red-300 uppercase tracking-wider bg-red-500/10">
                        <th className="px-6 py-4">Pipeline Subject</th>
                        <th className="px-6 py-4">Structure</th>
                        <th className="px-6 py-4">Priority Layer</th>
                        <th className="px-6 py-4">Impact Field</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {crs.filter(c => c.riskScore === 'High').map(cr => (
                        <tr key={cr._id} className="border-b border-red-500/10 hover:bg-red-500/10 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">{cr.title}</td>
                          <td className="px-6 py-4 text-zinc-400">{cr.changeType}</td>
                          <td className="px-6 py-4 text-red-400 font-semibold">{cr.priority}</td>
                          <td className="px-6 py-4"><span className="text-red-400 font-semibold bg-red-500/10 px-2 py-1 rounded text-xs border border-red-500/20">{cr.impactLevel || '—'}</span></td>
                          <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cr.status === 'Approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : cr.status === 'Rejected' ? 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5' : 'text-primary border-primary/20 bg-primary/5'}`}>{cr.status}</span></td>
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
