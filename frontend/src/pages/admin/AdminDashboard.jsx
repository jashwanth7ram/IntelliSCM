import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { crsAPI, reportsAPI, usersAPI } from '../../services/api'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { FaArrowRight } from 'react-icons/fa'

const COLORS = ['#FF4500', '#222222', '#f59e0b', '#ef4444', '#8b5cf6']

const TOOLTIP_STYLE = {
  backgroundColor: '#0a0a0a', border: '1px solid #333',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13, textTransform: 'uppercase', fontWeight: 700
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
    { name: 'Low',    value: crs.filter(c => c.riskScore === 'Low').length,    fill: '#222222' },
    { name: 'Medium', value: crs.filter(c => c.riskScore === 'Medium').length, fill: '#f59e0b' },
    { name: 'High',   value: crs.filter(c => c.riskScore === 'High').length,   fill: '#FF4500' },
  ]

  const byType = ['Feature','Bug Fix','Refactor','Security','Performance','Infrastructure'].map(t => ({
    name: t, count: crs.filter(c => c.changeType === t).length
  }))

  // Monthly trend
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
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          SYSTEM<br/><span className="text-primary">ADMIN</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">System-wide analytics, metrics, and user management.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total CRs',     value: crs.length, num: '01' },
          { label: 'Approval Rate', value: `${approvalRate}%`, num: '02' },
          { label: 'High Risk CRs', value: highRisk, num: '03' },
          { label: 'Pending',       value: crs.filter(c=>c.status==='Pending').length, num: '04' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:bg-[#161616] transition-colors relative group">
            <div className="text-primary font-bold text-sm mb-8 bg-primary/10 w-fit px-2 py-1 rounded inline-block">{s.num}</div>
            <div className={`text-6xl font-black mb-4 ${s.label === 'High Risk CRs' && s.value > 0 ? 'text-primary' : 'text-white'}`}>{s.value}</div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            <FaArrowRight className="absolute top-8 right-8 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <>
          {isReportsView ? (
          <div>
          {/* Row 1: Trend Line + Status Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#111] border border-[#222] rounded-xl p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Monthly CR Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="submitted" stroke="#555" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111' }} activeDot={{ r: 6 }} name="SUBMITTED"/>
                  <Line type="monotone" dataKey="approved"  stroke="#FF4500" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111' }} activeDot={{ r: 6 }} name="APPROVED"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">CR Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} stroke="none">
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
            <div className="bg-[#111] border border-[#222] rounded-xl p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byRisk} barSize={40} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#161616' }} />
                  <Bar dataKey="value" name="CRs" radius={[4,4,0,0]}>
                    {byRisk.map((r, i) => <Cell key={i} fill={r.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Changes by Type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byType} barSize={32} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#161616' }} />
                  <Bar dataKey="count" fill="#333" radius={[4,4,0,0]} name="Count"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
          ) : isUsersView ? (
          <div className="mb-16">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">SYSTEM USERS</h2>
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              <div className="p-0 overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="px-8 py-5">Name</th>
                      <th className="px-8 py-5">Email</th>
                      <th className="px-8 py-5">Role</th>
                      <th className="px-8 py-5">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                        <td className="px-8 py-5 font-bold text-white">{u.name}</td>
                        <td className="px-8 py-5 text-zinc-400 font-medium">{u.email}</td>
                        <td className="px-8 py-5"><span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{u.role}</span></td>
                        <td className="px-8 py-5 text-zinc-600 text-xs font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-16 text-xs font-bold uppercase tracking-widest text-zinc-600">No users found.</td></tr>
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
            <div className="mb-16">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8"><span className="text-primary">HIGH RISK</span> CHANGES</h2>
              <div className="bg-[#ff4500]/5 border border-[#ff4500]/20 rounded-xl overflow-hidden">
                <div className="p-0 overflow-x-auto">
                  <table className="w-full whitespace-nowrap text-left">
                    <thead>
                      <tr className="bg-[#ff4500]/10 border-b border-[#ff4500]/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <th className="px-8 py-5">Title</th>
                        <th className="px-8 py-5">Type</th>
                        <th className="px-8 py-5">Priority</th>
                        <th className="px-8 py-5">Impact</th>
                        <th className="px-8 py-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {crs.filter(c => c.riskScore === 'High').map(cr => (
                        <tr key={cr._id} className="border-b border-[#ff4500]/10 hover:bg-[#ff4500]/5 transition-colors">
                          <td className="px-8 py-5 font-bold text-white">{cr.title}</td>
                          <td className="px-8 py-5"><span className="text-xs font-medium text-zinc-400 bg-[#222] px-3 py-1 rounded">{cr.changeType}</span></td>
                          <td className="px-8 py-5"><span className="text-primary font-bold uppercase tracking-widest text-xs">{cr.priority}</span></td>
                          <td className="px-8 py-5"><span className="text-primary font-bold bg-[#ff4500]/10 px-3 py-1 rounded text-xs">{cr.impactLevel || '—'}</span></td>
                          <td className="px-8 py-5"><span className={`text-xs font-bold uppercase tracking-wider ${cr.status === 'Approved' ? 'text-emerald-500' : cr.status === 'Rejected' ? 'text-zinc-500' : 'text-primary'}`}>{cr.status}</span></td>
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
