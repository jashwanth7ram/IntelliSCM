import { useEffect, useState } from 'react'
import { crsAPI } from '../../services/api'
import { FaCodeBranch, FaBrain, FaArrowRight } from 'react-icons/fa'
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
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          DEVELOPER<br/><span className="text-primary">DASHBOARD</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Track change requests and code risk.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total CRs',  value: myCrs.length, num: '01' },
          { label: 'Pending',    value: pending,      num: '02' },
          { label: 'Approved',   value: approved,     num: '03' },
          { label: 'Rejected',   value: rejected,     num: '04' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:bg-[#161616] transition-colors relative group">
            <div className="text-primary font-bold text-sm mb-8 bg-primary/10 w-fit px-2 py-1 rounded inline-block">{s.num}</div>
            <div className={`text-6xl font-black text-white mb-4 ${s.label === 'Pending' ? 'text-zinc-400' : s.label === 'Approved' ? 'text-white' : s.label === 'Rejected' ? 'text-zinc-600' : 'text-white'}`}>{s.value}</div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            <FaArrowRight className="absolute top-8 right-8 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">SERVICES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <Link to="/developer/submit-cr" className="bg-[#111] border border-[#222] rounded-xl p-10 hover:border-primary transition-colors group flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
              <FaCodeBranch size={20} />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Submit Change Request</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Propose new features, bug fixes, or architectural changes directly into the automated pipeline.</p>
          </div>
          <div className="mt-8 flex items-center text-xs font-bold text-primary uppercase tracking-widest gap-2">
            Get Started <FaArrowRight />
          </div>
        </Link>
        <Link to="/ml-insights" className="bg-[#111] border border-[#222] rounded-xl p-10 hover:border-primary transition-colors group flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
              <FaBrain size={20} />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3">ML Risk Analysis</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">Predict defect probability using our RandomForest model trained on NASA JM1 software metrics.</p>
          </div>
          <div className="mt-8 flex items-center text-xs font-bold text-primary uppercase tracking-widest gap-2">
            Analyze Code <FaArrowRight />
          </div>
        </Link>
      </div>

      {/* My Change Requests */}
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">RECENT WORK</h2>
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-32 px-6">
              <span className="loading loading-spinner text-primary loading-lg"></span>
            </div>
          ) : myCrs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-zinc-600">
              <FaCodeBranch size={48} className="opacity-20 mb-6" />
              <p className="text-sm font-bold uppercase tracking-widest">No recent work found.</p>
            </div>
          ) : (
            <table className="w-full whitespace-nowrap text-left">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Title</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Priority</th>
                  <th className="px-8 py-5">Risk</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {myCrs.map(cr => (
                  <tr key={cr._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                    <td className="px-8 py-5 font-bold text-white max-w-[250px] truncate">{cr.title}</td>
                    <td className="px-8 py-5"><span className="text-xs font-medium text-zinc-400 bg-[#222] px-3 py-1 rounded">{cr.changeType}</span></td>
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
  )
}
