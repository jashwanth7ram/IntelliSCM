import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI } from '../../services/api'
import { FaArrowRight, FaPlus, FaTimes } from 'react-icons/fa'

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
      setMsg('Baseline created successfully.')
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
      setMsg('Audit scheduled successfully.')
      setShowAudit(false)
      setAudit({ auditType: 'FCA', scheduledDate: '', notes: '' })
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to schedule audit.')
    } finally { setALoading(false) }
    setTimeout(() => setMsg(''), 4000)
  }

  const approved = crs.filter(c => c.status === 'Approved').length
  const pending = crs.filter(c => c.status === 'Pending').length

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          SYSTEM<br/><span className="text-primary">AUDITOR</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Manage baselines, schedule FCA/PCA audits, and review approval trail.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {[
          { label: 'Approved CRs',   value: approved,   num: '01' },
          { label: 'Total CRs',      value: crs.length, num: '02' },
          { label: 'Pending Review', value: pending,    num: '03' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:bg-[#161616] transition-colors relative group">
            <div className="text-primary font-bold text-sm mb-8 bg-primary/10 w-fit px-2 py-1 rounded inline-block">{s.num}</div>
            <div className="text-6xl font-black text-white mb-4">{s.value}</div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            <FaArrowRight className="absolute top-8 right-8 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {msg && <div className="bg-primary/20 border border-primary text-white px-6 py-4 rounded-lg mb-8 text-sm font-bold tracking-wide uppercase">{msg}</div>}

      {/* Actions */}
      {isBaselinesView ? (
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AUDIT ACTIONS</h2>
          <div className="flex gap-4">
            <button className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all text-xs" onClick={() => { setShowBaseline(s=>!s); setShowAudit(false) }}>
              Create Baseline
            </button>
            <button className="bg-transparent border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all text-xs" onClick={() => { setShowAudit(s=>!s); setShowBaseline(false) }}>
              Schedule Audit
            </button>
          </div>
        </div>

        {/* Baseline Form */}
        {showBaseline && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">CREATE VERSION BASELINE</h3>
            <form onSubmit={createBaseline} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Version Tag *</label>
                  <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                    placeholder="V1.4.2" value={baseline.version} onChange={setB('version')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Project ID</label>
                  <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                    placeholder="PROJECT IDENTIFIER" value={baseline.project} onChange={setB('project')} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <textarea className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm min-h-[120px] placeholder-zinc-700 leading-relaxed" 
                  placeholder="WHAT DOES THIS BASELINE REPRESENT?" value={baseline.description} onChange={setB('description')} />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-10 py-4 rounded-lg transition-all text-xs" disabled={bLoading}>
                  {bLoading ? 'Creating...' : 'Create Baseline'}
                </button>
                <button type="button" className="bg-transparent border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg transition-all text-xs" onClick={() => setShowBaseline(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Form */}
        {showAudit && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">SCHEDULE AUDIT</h3>
            <form onSubmit={scheduleAudit} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Audit Type</label>
                  <select className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm appearance-none" 
                    value={audit.auditType} onChange={setA('auditType')}>
                    {AUDIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scheduled Date *</label>
                  <input type="date" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm" 
                    value={audit.scheduledDate} onChange={setA('scheduledDate')} required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notes</label>
                <textarea className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm min-h-[120px] placeholder-zinc-700 leading-relaxed" 
                  placeholder="AUDIT SCOPE AND OBJECTIVES..." value={audit.notes} onChange={setA('notes')} />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest px-10 py-4 rounded-lg transition-all text-xs" disabled={aLoading}>
                  {aLoading ? 'Scheduling...' : 'Schedule Audit'}
                </button>
                <button type="button" className="bg-transparent border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg transition-all text-xs" onClick={() => setShowAudit(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      ) : (
      <div className="mb-16">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">APPROVED CHANGE TRAIL</h2>
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-32 px-6">
                <span className="loading loading-spinner text-primary loading-lg"></span>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="bg-[#0a0a0a] border-b border-[#222] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <th className="px-8 py-5">CR Title</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Priority</th>
                    <th className="px-8 py-5">Risk</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {crs.filter(c => c.status === 'Approved').map(cr => (
                    <tr key={cr._id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                      <td className="px-8 py-5 font-bold text-white max-w-[250px] truncate">{cr.title}</td>
                      <td className="px-8 py-5"><span className="text-xs font-medium text-zinc-400 bg-[#222] px-3 py-1 rounded">{cr.changeType}</span></td>
                      <td className="px-8 py-5 font-medium text-zinc-300">{cr.priority}</td>
                      <td className="px-8 py-5">
                        <span className={`text-xs font-bold px-3 py-1 rounded ${cr.riskScore === 'High' ? 'text-[#050505] bg-primary' : cr.riskScore === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                          {cr.riskScore || 'Low'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Approved</span>
                      </td>
                      <td className="px-8 py-5 text-zinc-600 text-xs font-mono">
                        {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {crs.filter(c => c.status === 'Approved').length === 0 && (
                    <tr><td colSpan={6} className="text-center py-16 text-xs font-bold uppercase tracking-widest text-zinc-600">No approved CRs yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
