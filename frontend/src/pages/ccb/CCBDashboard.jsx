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
      setMsg(`Decision submitted: ${decision[crId]}`)
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
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          CHANGE<br/><span className="text-primary">CONTROL BOARD</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Review and decide on pending change requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Pending Review', value: pendingCrs.length, num: '01' },
          { label: 'Approved',       value: approved,          num: '02' },
          { label: 'Rejected',       value: rejected,          num: '03' },
          { label: 'Total CRs',      value: crs.length,        num: '04' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:bg-[#161616] transition-colors relative group">
            <div className="text-primary font-bold text-sm mb-8 bg-primary/10 w-fit px-2 py-1 rounded inline-block">{s.num}</div>
            <div className={`text-6xl font-black mb-4 ${s.label === 'Rejected' ? 'text-zinc-600' : 'text-white'}`}>{s.value}</div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            <FaArrowRight className="absolute top-8 right-8 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {msg && <div className="bg-primary/20 border border-primary text-white px-6 py-4 rounded-lg mb-8 text-sm font-bold tracking-wide uppercase">{msg}</div>}

      {/* Pending CRs */}
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">PENDING DECISIONS</h2>
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : pendingCrs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-6 bg-[#111] border border-[#222] rounded-xl text-zinc-600 mb-16">
          <FaShieldAlt size={48} className="opacity-20 mb-6" />
          <p className="text-sm font-bold uppercase tracking-widest">No pending change requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-16">
          {pendingCrs.map(cr => (
            <div key={cr._id} className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{cr.title}</h3>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#222] text-zinc-400 px-3 py-1.5 rounded">{cr.changeType}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#222] text-zinc-400 px-3 py-1.5 rounded">{cr.priority} PRIORITY</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded ${cr.riskScore === 'High' ? 'bg-primary text-[#050505]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      RISK: {cr.riskScore || 'Low'}
                    </span>
                    {cr.impactLevel && <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded">IMPACT: {cr.impactLevel}</span>}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#0a0a0a] px-3 py-2 rounded border border-[#222]">
                  {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : ''}
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-6 rounded-lg border border-[#222] mb-6 relative z-10">
                <p className="text-sm font-medium text-zinc-400 leading-relaxed whitespace-pre-wrap">{cr.description}</p>
              </div>

              {cr.affectedComponents?.length > 0 && (
                <div className="mb-8 text-xs font-bold text-zinc-500 uppercase tracking-widest relative z-10">
                  <span className="text-white">COMPONENTS:</span> {cr.affectedComponents.join(', ')}
                </div>
              )}

              {/* Decision Controls */}
              <div className="mt-8 pt-8 border-t border-[#222] flex flex-col md:flex-row gap-6 items-end relative z-10">
                <div className="flex flex-col gap-2 w-full md:w-1/4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Decision</label>
                  <select className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-4 py-3 rounded-md outline-none text-sm appearance-none"
                    value={decision[cr._id] || ''}
                    onChange={e => setDecision(d => ({ ...d, [cr._id]: e.target.value }))}>
                    <option value="">— SELECT —</option>
                    {DECISIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 w-full md:flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comments (Optional)</label>
                  <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-4 py-3 rounded-md outline-none text-sm" 
                    placeholder="ADD REVIEW NOTES..."
                    value={comments[cr._id] || ''}
                    onChange={e => setComments(c => ({ ...c, [cr._id]: e.target.value }))} />
                </div>
                <button
                  className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-8 py-3.5 rounded-md transition-all text-xs w-full md:w-auto"
                  disabled={!decision[cr._id] || deciding[cr._id]}
                  onClick={() => submitDecision(cr._id)}
                >
                  {deciding[cr._id] ? 'SUBMITTING...' : 'CONFIRM DECISION'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision History */}
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">DECISION HISTORY</h2>
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="p-0 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5">Title</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Risk</th>
                <th className="px-8 py-5">Priority</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {crs.filter(c => c.status !== 'Pending' && c.status !== 'Submitted' && c.status !== 'Under Review').map(cr => (
                <tr key={cr._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                  <td className="px-8 py-5 font-bold text-white max-w-[250px] truncate">{cr.title}</td>
                  <td className="px-8 py-5"><span className="text-xs font-medium text-zinc-400 bg-[#222] px-3 py-1 rounded">{cr.changeType}</span></td>
                  <td className="px-8 py-5">
                    <span className={`text-xs font-bold px-3 py-1 rounded ${cr.riskScore === 'High' ? 'text-[#050505] bg-primary' : cr.riskScore === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                      {cr.riskScore || 'Low'}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-medium text-zinc-300">{cr.priority}</td>
                  <td className="px-8 py-5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${cr.status === 'Approved' ? 'text-emerald-500' : cr.status === 'Rejected' ? 'text-zinc-500' : 'text-primary'}`}>
                      {cr.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-zinc-600 text-xs font-mono">
                    {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : '—'}
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
