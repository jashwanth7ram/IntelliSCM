import { useEffect, useState } from 'react'
import { crsAPI, ccbAPI } from '../../services/api'
import { FaArrowRight, FaShieldAlt } from 'react-icons/fa'

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
      setMsg(`Decision processed: ${decision[crId]}`)
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to submit decision.')
      setTimeout(() => setMsg(''), 3000)
    } finally { setDeciding(d => ({ ...d, [crId]: false })) }
  }

  const approved = crs.filter(c => c.status === 'Approved').length
  const rejected = crs.filter(c => c.status === 'Rejected').length

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-12 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          Change Control Board
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Evaluate architectural modifications, assess risk metrics, and enforce quality gates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Pending Review', value: pendingCrs.length },
          { label: 'Approved',       value: approved },
          { label: 'Rejected',       value: rejected },
          { label: 'Total CRs',      value: crs.length },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative group">
            <div className="text-4xl font-black text-white tracking-tight mb-2">{s.value}</div>
            <div className="text-sm font-medium text-textMuted">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && <div className="bg-primary/10 border border-primary/20 text-primary px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-primary"></span>{msg}</div>}

      {/* Pending CRs */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Pending Decisions</h2>
        {loading ? (
          <div className="flex justify-center items-center py-20 px-6">
            <span className="loading loading-spinner text-primary loading-lg"></span>
          </div>
        ) : pendingCrs.length === 0 ? (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center py-24 px-6 text-zinc-600">
            <FaShieldAlt size={32} className="opacity-40 mb-4" />
            <p className="text-sm font-medium text-white/50">No pending change requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingCrs.map(cr => (
              <div key={cr._id} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-4">{cr.title}</h3>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.05] text-white/70">{cr.changeType || 'N/A'}</span>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.05] text-white/70">{cr.priorityLevel || 'Medium'} Priority</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${cr.riskScore === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/20' : cr.riskScore === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cr.riskScore === 'High' ? 'bg-red-400' : cr.riskScore === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        Risk: {cr.riskScore || 'Low'}
                      </span>
                      {cr.impactLevel && <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">Impact: {cr.impactLevel}</span>}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-textMuted bg-black/20 px-4 py-2 rounded-xl border border-white/[0.05]">
                    {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>

                <div className="bg-black/40 p-6 rounded-2xl border border-white/[0.05] mb-8 relative z-10 shadow-inner">
                  <p className="text-sm font-medium text-zinc-300 leading-relaxed whitespace-pre-wrap">{cr.description}</p>
                </div>

                {cr.affectedComponents?.length > 0 && (
                  <div className="mb-8 text-sm font-semibold text-textMuted relative z-10">
                    <span className="text-white">Components:</span> {cr.affectedComponents.join(', ')}
                  </div>
                )}

                {/* Decision Controls */}
                <div className="mt-8 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row gap-6 items-end relative z-10">
                  <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Decision</label>
                    <select className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3.5 rounded-xl outline-none text-sm appearance-none shadow-inner"
                      value={decision[cr._id] || ''}
                      onChange={e => setDecision(d => ({ ...d, [cr._id]: e.target.value }))}>
                      <option value="" className="bg-zinc-900">— SELECT —</option>
                      {DECISIONS.map(d => <option key={d} className="bg-zinc-900">{d}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:flex-1">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Comments (Optional)</label>
                    <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3.5 rounded-xl outline-none text-sm shadow-inner" 
                      placeholder="Add review notes..."
                      value={comments[cr._id] || ''}
                      onChange={e => setComments(c => ({ ...c, [cr._id]: e.target.value }))} />
                  </div>
                  <button
                    className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm w-full md:w-auto shadow-[0_0_15px_rgba(168,127,243,0.3)] disabled:opacity-50"
                    disabled={!decision[cr._id] || deciding[cr._id]}
                    onClick={() => submitDecision(cr._id)}
                  >
                    {deciding[cr._id] ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision History */}
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Decision History</h2>
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="p-0 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left">
            <thead>
              <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Risk</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {crs.filter(c => c.status !== 'Pending' && c.status !== 'Submitted' && c.status !== 'Under Review').map(cr => (
                <tr key={cr._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white max-w-[250px] truncate">{cr.title}</td>
                  <td className="px-6 py-4 text-textMuted">{cr.changeType}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cr.riskScore === 'High' ? 'text-red-400 bg-red-400/10 border border-red-400/20' : cr.riskScore === 'Medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cr.riskScore === 'High' ? 'bg-red-400' : cr.riskScore === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      {cr.riskScore || 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-300">{cr.priorityLevel || 'Medium'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cr.status === 'Approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : cr.status === 'Rejected' ? 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5' : 'text-primary border-primary/20 bg-primary/5'}`}>
                      {cr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-textMuted text-right">
                    {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
