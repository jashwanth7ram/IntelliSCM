import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI } from '../../services/api'
import { FaArrowRight, FaShieldAlt } from 'react-icons/fa'

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
      setMsg('Baseline securely committed.')
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
      setMsg('Audit operation scheduled.')
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
      <div className="mb-12 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          System Configuration Auditor
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Maintain compliance standards, snapshot configuration baselines, and execute audits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {[
          { label: 'Approved Changes', value: approved },
          { label: 'Total CRs Evaluated', value: crs.length },
          { label: 'Pending Queue', value: pending },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative group">
            <div className="text-4xl font-black text-white tracking-tight mb-2">{s.value}</div>
            <div className="text-sm font-medium text-textMuted">{s.label}</div>
            <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <FaArrowRight className="text-primary text-xs" />
            </div>
          </div>
        ))}
      </div>

      {msg && <div className="bg-primary/10 border border-primary/20 text-primary px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-primary"></span>{msg}</div>}

      {/* Actions */}
      {isBaselinesView ? (
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Audit Operations</h2>
          <div className="flex gap-4">
            <button className="bg-primary hover:bg-primaryHover text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(168,127,243,0.3)]" onClick={() => { setShowBaseline(s=>!s); setShowAudit(false) }}>
              Snapshot Baseline
            </button>
            <button className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm" onClick={() => { setShowAudit(s=>!s); setShowBaseline(false) }}>
              Schedule Audit
            </button>
          </div>
        </div>

        {/* Baseline Form */}
        {showBaseline && (
          <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <h3 className="text-xl font-bold text-white tracking-tight mb-6">Create Config Baseline</h3>
            <form onSubmit={createBaseline} className="flex flex-col gap-6 relative z-10 w-full lg:max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Version Tag *</label>
                  <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner" 
                    placeholder="v1.4.2-stable" value={baseline.version} onChange={setB('version')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project Scope</label>
                  <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner" 
                    placeholder="Enter project identifier" value={baseline.project} onChange={setB('project')} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description</label>
                <textarea className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm min-h-[100px] placeholder-zinc-700 shadow-inner resize-y" 
                  placeholder="Define the state of the baseline..." value={baseline.description} onChange={setB('description')} />
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]" disabled={bLoading}>
                  {bLoading ? 'Processing...' : 'Commit Baseline'}
                </button>
                <button type="button" className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm" onClick={() => setShowBaseline(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Form */}
        {showAudit && (
          <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-10 overflow-hidden relative">
            <h3 className="text-xl font-bold text-white tracking-tight mb-6">Schedule Compliance Audit</h3>
            <form onSubmit={scheduleAudit} className="flex flex-col gap-6 relative z-10 w-full lg:max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Protocol</label>
                  <select className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner" 
                    value={audit.auditType} onChange={setA('auditType')}>
                    {AUDIT_TYPES.map(t => <option key={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Scheduled Execution *</label>
                  <input type="date" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm shadow-inner" 
                    value={audit.scheduledDate} onChange={setA('scheduledDate')} required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Notes</label>
                <textarea className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm min-h-[100px] placeholder-zinc-700 shadow-inner resize-y" 
                  placeholder="Audit objectives..." value={audit.notes} onChange={setA('notes')} />
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]" disabled={aLoading}>
                  {aLoading ? 'Processing...' : 'Confirm Audit Date'}
                </button>
                <button type="button" className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm" onClick={() => setShowAudit(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      ) : (
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Approved Change Trail</h2>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20 px-6">
                <span className="loading loading-spinner text-primary loading-lg"></span>
              </div>
            ) : (
              <table className="w-full whitespace-nowrap text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                    <th className="px-6 py-4">CR Title</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {crs.filter(c => c.status === 'Approved').map(cr => (
                    <tr key={cr._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold text-white max-w-[250px] truncate">{cr.title}</td>
                      <td className="px-6 py-4 text-textMuted">{cr.changeType}</td>
                      <td className="px-6 py-4 font-medium text-zinc-300">{cr.priority}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cr.riskScore === 'High' ? 'text-red-400 bg-red-400/10 border border-red-400/20' : cr.riskScore === 'Medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cr.riskScore === 'High' ? 'bg-red-400' : cr.riskScore === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          {cr.riskScore || 'Low'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full border text-emerald-400 border-emerald-400/20 bg-emerald-400/5">
                          Approved
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textMuted text-right">
                        {cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                      </td>
                    </tr>
                  ))}
                  {crs.filter(c => c.status === 'Approved').length === 0 && (
                    <tr><td colSpan={6} className="text-center py-24 text-sm font-medium text-white/50">No approved CRs present in the trail.</td></tr>
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
