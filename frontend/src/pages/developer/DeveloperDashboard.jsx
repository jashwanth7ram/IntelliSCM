import { useEffect, useState } from 'react'
import { crsAPI } from '../../services/api'
import { FaCodeBranch, FaBrain, FaArrowRight, FaMagic } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <FaMagic /> Welcome back, {user?.name?.split(' ')[0] || 'Developer'}
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          Developer Overview
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Monitor your change requests, analyze code risk, and track deployment pipelines in real-time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total Requests',  value: myCrs.length },
          { label: 'In Review',       value: pending },
          { label: 'Merged',          value: approved },
          { label: 'Requires Changes',value: rejected },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative group">
            <div className="text-4xl font-black text-white tracking-tight mb-2">{s.value}</div>
            <div className="text-sm font-medium text-textMuted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/developer/submit-cr" className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8 hover:border-primary/40 transition-colors group relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 border border-primary/20">
              <FaCodeBranch size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2">Submit Change Request</h3>
            <p className="text-sm text-textMuted leading-relaxed">
              Propose new features or branch modifications for integration into the core repository.
            </p>
          </Link>
          <Link to="/ml-insights" className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 hover:border-white/[0.1] transition-colors group relative overflow-hidden">
            <div className="w-12 h-12 bg-white/[0.05] text-white rounded-xl flex items-center justify-center mb-6 border border-white/[0.1]">
              <FaBrain size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2">ML Risk Analysis</h3>
            <p className="text-sm text-textMuted leading-relaxed">
              Evaluate your code changes against our trained defect prediction models.
            </p>
          </Link>
        </div>
      </div>

      {/* My Change Requests */}
      <div className="mb-16">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Recent Activity</h2>
          <Link to="/developer/submit-cr" className="text-sm font-medium text-primary hover:text-white transition-colors">View All Archive &rarr;</Link>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20 px-6">
                <span className="loading loading-spinner text-primary loading-lg"></span>
              </div>
            ) : myCrs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-zinc-600">
                <FaCodeBranch size={32} className="opacity-40 mb-4" />
                <p className="text-sm font-medium">No recent activity.</p>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                    <th className="px-6 py-4">Request Title</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">AI Risk</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {myCrs.map(cr => (
                    <tr key={cr._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white max-w-[300px] truncate">{cr.title}</div>
                        <div className="text-xs text-textMuted mt-1">{cr.changeType}</div>
                      </td>
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
    </div>
  )
}
