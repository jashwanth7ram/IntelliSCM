import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI, projectsAPI } from '../../services/api'
import { FaSearch, FaShieldAlt, FaCodeBranch, FaRegFileAlt, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa'
import { cisAPI } from '../../services/api'

const AUDIT_TYPES = ['FCA', 'PCA']

const STATUS_COLORS = {
  Submitted:            'text-blue-400    bg-blue-400/10    border-blue-400/20',
  'Under Review':       'text-amber-400   bg-amber-400/10   border-amber-400/20',
  Approved:             'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Rejected:             'text-red-400     bg-red-400/10     border-red-400/20',
  'Needs Modification': 'text-orange-400  bg-orange-400/10  border-orange-400/20',
  'Emergency Fix':      'text-purple-400  bg-purple-400/10  border-purple-400/20',
}

const inputCls  = 'w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors'
const selectCls = 'w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors'

export default function AuditorDashboard() {
  const location = useLocation()
  const isBaselinesView = location.pathname === '/auditor/baselines'

  // Shared data
  const [crs, setCrs]         = useState([])
  const [projects, setProjects] = useState([])
  const [cis, setCis]           = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ type: '', text: '' })

  // Active form toggle: null | 'baseline' | 'audit'
  const [activeForm, setActiveForm] = useState(null)

  // CR table filters
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterProject, setFilterProject] = useState('')

  // Baseline form
  const [baseline, setBaseline] = useState({ versionNumber: '', description: '', project: '' })
  const [bLoading, setBLoading] = useState(false)

  // Audit form
  const [audit, setAudit] = useState({ auditType: 'FCA', auditDate: '', auditLocation: '', notes: '', project: '' })
  const [aLoading, setALoading] = useState(false)

  // History
  const [auditHistory, setAuditHistory]       = useState([])
  const [baselineHistory, setBaselineHistory] = useState([])

  const loadHistory = () =>
    Promise.all([auditsAPI.list(), baselinesAPI.list()])
      .then(([a, b]) => { setAuditHistory(a.data || []); setBaselineHistory(b.data || []) })
      .catch(() => {})

  useEffect(() => {
    Promise.all([crsAPI.list(), projectsAPI.list(), cisAPI.list()])
      .then(([c, p, ci]) => { setCrs(c.data || []); setProjects(p.data || []); setCis(ci.data || []) })
      .catch(() => flash('error', 'Failed to load data.'))
      .finally(() => setLoading(false))
    loadHistory()
  }, [])

  const setB = k => e => setBaseline(x => ({ ...x, [k]: e.target.value }))
  const setA = k => e => setAudit(x => ({ ...x, [k]: e.target.value }))

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const createBaseline = async e => {
    e.preventDefault(); setBLoading(true)
    try {
      const res = await baselinesAPI.create(baseline)
      setBaselineHistory(h => [res.data, ...h])
      flash('success', '✓ Baseline committed successfully.')
      setBaseline({ versionNumber: '', description: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to create baseline.')
    } finally { setBLoading(false) }
  }

  const scheduleAudit = async e => {
    e.preventDefault(); setALoading(true)
    try {
      const { notes, ...rest } = audit
      const res = await auditsAPI.create({ ...rest, complianceNotes: notes })
      setAuditHistory(h => [res.data, ...h])
      flash('success', '✓ Audit scheduled successfully.')
      setAudit({ auditType: 'FCA', auditDate: '', auditLocation: '', notes: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || err.response?.data?.message || 'Failed to schedule audit.')
    } finally { setALoading(false) }
  }

  // Stats for CR view
  const approved = crs.filter(c => c.status === 'Approved').length
  const pending  = crs.filter(c => ['Submitted', 'Under Review'].includes(c.status)).length
  const rejected = crs.filter(c => c.status === 'Rejected').length

  const filtered = crs.filter(cr => {
    const q = search.toLowerCase()
    const matchSearch  = !q || cr.title?.toLowerCase().includes(q) || cr.submittedBy?.name?.toLowerCase().includes(q)
    const matchStatus  = !filterStatus  || cr.status === filterStatus
    const matchProject = !filterProject || cr.project?._id === filterProject
    return matchSearch && matchStatus && matchProject
  })

  // ─── BASELINES PAGE ──────────────────────────────────────────────
  if (isBaselinesView) {
    return (
      <div className="fade-in pb-16 font-sans px-4 sm:px-8 max-w-[1100px] mx-auto">
        <div className="mb-10 pt-8">
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3">Baselines & Audits</h1>
          <p className="text-lg text-textMuted leading-relaxed">Create configuration baselines and schedule formal compliance audits.</p>
        </div>

        {msg.text && (
          <div className={`px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {msg.text}
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveForm(f => f === 'baseline' ? null : 'baseline')}
            className={`font-semibold py-3 px-7 rounded-xl transition-all text-sm flex items-center gap-2 ${activeForm === 'baseline' ? 'bg-primary text-white shadow-[0_0_15px_rgba(168,127,243,0.4)]' : 'bg-white/[0.03] border border-white/[0.08] text-textMuted hover:text-white hover:bg-white/[0.06]'}`}
          >
            <FaRegFileAlt size={13} /> Snapshot Baseline
          </button>
          <button
            onClick={() => setActiveForm(f => f === 'audit' ? null : 'audit')}
            className={`font-semibold py-3 px-7 rounded-xl transition-all text-sm flex items-center gap-2 ${activeForm === 'audit' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/[0.03] border border-white/[0.08] text-textMuted hover:text-white hover:bg-white/[0.06]'}`}
          >
            <FaShieldAlt size={13} /> Schedule Audit
          </button>
        </div>

        {/* ── BASELINE section ── */}
        {activeForm === 'baseline' && (
          <div className="flex flex-col gap-6 mb-10">
            {/* Form */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2 relative z-10">
                <FaRegFileAlt className="text-primary" /> Create Configuration Baseline
              </h2>
              <form onSubmit={createBaseline} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Version Tag *</label>
                  <input type="text" className={inputCls} placeholder="e.g. v1.4.2-stable"
                    value={baseline.versionNumber} onChange={setB('versionNumber')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project *</label>
                  <select className={selectCls} value={baseline.project} onChange={setB('project')} required>
                    <option value="" className="bg-zinc-900">Select project...</option>
                    {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description *</label>
                  <textarea className={`${inputCls} min-h-[90px] resize-y`}
                    placeholder="Describe the configuration state at this baseline..."
                    value={baseline.description} onChange={setB('description')} required />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" disabled={bLoading}
                    className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)] disabled:opacity-50">
                    {bLoading ? 'Saving...' : 'Commit Baseline'}
                  </button>
                  <button type="button" onClick={() => setActiveForm(null)}
                    className="bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-textMuted hover:text-white font-medium px-6 py-3 rounded-xl transition-all text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Baseline History */}
            <div>
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <FaRegFileAlt className="text-primary" size={13} /> Committed Baselines History
              </h3>
              {baselineHistory.length === 0 ? (
                <p className="text-xs text-white/20 ml-1">No baselines committed yet.</p>
              ) : (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                        <th className="px-5 py-3">Version</th>
                        <th className="px-5 py-3">Project</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3">Created By</th>
                        <th className="px-5 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.025]">
                      {baselineHistory.map(b => (
                        <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono">
                              {b.versionNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-textMuted">{b.project?.name || '—'}</td>
                          <td className="px-5 py-3 text-white max-w-[240px] truncate">{b.description}</td>
                          <td className="px-5 py-3 text-textMuted">{b.createdBy?.name || '—'}</td>
                          <td className="px-5 py-3 text-textMuted text-right text-xs">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUDIT section ── */}
        {activeForm === 'audit' && (
          <div className="flex flex-col gap-6 mb-10">
            {/* Form */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2 relative z-10">
                <FaShieldAlt className="text-blue-400" /> Schedule Compliance Audit
              </h2>
              <form onSubmit={scheduleAudit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Type</label>
                  <select className={selectCls} value={audit.auditType} onChange={setA('auditType')}>
                    {AUDIT_TYPES.map(t => <option key={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project *</label>
                  <select className={selectCls} value={audit.project} onChange={setA('project')} required>
                    <option value="" className="bg-zinc-900">Select project...</option>
                    {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Date *</label>
                  <input type="date" className={inputCls} style={{ colorScheme: 'dark' }}
                    value={audit.auditDate} onChange={setA('auditDate')}
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Location</label>
                  <input type="text" className={inputCls} placeholder="e.g. Conference Room B, Floor 3"
                    value={audit.auditLocation} onChange={setA('auditLocation')} />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Compliance Notes</label>
                  <input type="text" className={inputCls} placeholder="Audit objectives or scope..."
                    value={audit.notes} onChange={setA('notes')} />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" disabled={aLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50">
                    {aLoading ? 'Scheduling...' : 'Confirm Audit Date'}
                  </button>
                  <button type="button" onClick={() => setActiveForm(null)}
                    className="bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-textMuted hover:text-white font-medium px-6 py-3 rounded-xl transition-all text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Audit History */}
            <div>
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <FaShieldAlt className="text-blue-400" size={13} /> Scheduled Audits History
              </h3>
              {auditHistory.length === 0 ? (
                <p className="text-xs text-white/20 ml-1">No audits scheduled yet.</p>
              ) : (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Project</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Location</th>
                        <th className="px-5 py-3">Notes</th>
                        <th className="px-5 py-3 text-right">Scheduled On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.025]">
                      {auditHistory.map(a => (
                        <tr key={a._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              {a.auditType}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-textMuted">{a.project?.name || '—'}</td>
                          <td className="px-5 py-3 text-white font-medium">
                            {a.auditDate ? new Date(a.auditDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-5 py-3 text-textMuted">{a.auditLocation || '—'}</td>
                          <td className="px-5 py-3 text-textMuted max-w-[180px] truncate">{a.complianceNotes || '—'}</td>
                          <td className="px-5 py-3 text-textMuted text-right text-xs">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {!activeForm && (
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-center py-16">
            <p className="text-sm text-white/30">Select an action above to get started.</p>
          </div>
        )}
      </div>
    )
  }

  // ─── AUDIT DASHBOARD (CR trail) ──────────────────────────────────
  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-10 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3">Audit Dashboard</h1>
        <p className="text-lg text-textMuted leading-relaxed">Full change trail visibility across all projects and teams.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total CRs',      value: crs.length, color: 'text-white' },
          { label: 'Approved',       value: approved,   color: 'text-emerald-400' },
          { label: 'Pending Review', value: pending,    color: 'text-amber-400' },
          { label: 'Rejected',       value: rejected,   color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className={`text-3xl font-black tracking-tight mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-textMuted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Audit Gap Analysis Widget (Competitive Feature) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <FaExclamationTriangle className="text-amber-500" />
             Compliance Gap Analysis
          </h2>
          <div className="space-y-4">
             {cis.filter(ci => ci.complianceStatus !== 'Compliant').slice(0, 5).map(ci => (
               <div key={ci._id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-bold text-xs uppercase">
                        {ci.type?.slice(0, 2) || 'CI'}
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-white">{ci.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-tighter">{ci.ciId} • {ci.project?.name}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase`}>
                        {ci.complianceStatus}
                     </span>
                     <p className="text-[10px] text-zinc-600 mt-1">Pending since {ci.lastAuditedAt ? new Date(ci.lastAuditedAt).toLocaleDateString() : 'Initial Baseline'}</p>
                  </div>
               </div>
             ))}
             {cis.filter(ci => ci.complianceStatus !== 'Compliant').length === 0 && (
                <div className="py-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.05]">
                   <FaCheckCircle className="mx-auto text-emerald-500/30 mb-2" size={24} />
                   <p className="text-xs text-white/20 italic">Global Compliance Achieved. No items overdue.</p>
                </div>
             )}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full border-[8px] border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
               <span className="text-2xl font-black text-white">
                  {Math.round((cis.filter(ci => ci.complianceStatus === 'Compliant').length / (cis.length || 1)) * 100)}%
               </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Audit Readiness</h3>
            <p className="text-xs text-textMuted max-w-[200px]">Percentage of Configuration Items verified in current project cycle.</p>
            <div className="mt-8 w-full space-y-3">
               <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                  <span>Baseline Coverage</span>
                  <span>{cis.filter(ci => ci.lastAuditedAt).length}/{cis.length}</span>
               </div>
               <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(cis.filter(ci => ci.lastAuditedAt).length / (cis.length || 1)) * 100}%` }} />
               </div>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input type="text"
            className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm placeholder-zinc-600 transition-colors"
            placeholder="Search by title or submitter..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-white/[0.02] border border-white/[0.05] text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="" className="bg-zinc-900">All Statuses</option>
          {['Submitted','Under Review','Approved','Rejected','Needs Modification','Emergency Fix'].map(s => (
            <option key={s} value={s} className="bg-zinc-900">{s}</option>
          ))}
        </select>
        <select className="bg-white/[0.02] border border-white/[0.05] text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
          value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="" className="bg-zinc-900">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
        </select>
      </div>

      {/* CR Table */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <span className="loading loading-spinner text-primary loading-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <FaCodeBranch size={28} className="opacity-20 mb-4 text-white" />
            <p className="text-sm text-white/30">No change requests match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left">
              <thead>
                <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                  <th className="px-6 py-4">CR Title</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">AI Risk</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/[0.02]">
                {filtered.map(cr => (
                  <tr key={cr._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white max-w-[220px] truncate">{cr.title}</div>
                      {cr.branchName && <div className="text-xs text-zinc-500 font-mono mt-0.5">{cr.branchName}</div>}
                    </td>
                    <td className="px-6 py-4 text-textMuted">{cr.submittedBy?.name || '—'}</td>
                    <td className="px-6 py-4 text-textMuted">{cr.project?.name || '—'}</td>
                    <td className="px-6 py-4 text-textMuted text-xs">{cr.changeType || '—'}</td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{cr.priorityLevel || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        cr.riskScore === 'High'   ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                        cr.riskScore === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                                                    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {cr.riskScore || 'Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[cr.status] || STATUS_COLORS.Submitted}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {cr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-textMuted text-right text-xs">
                      {cr.createdAt ? new Date(cr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-600 text-right mt-3">{filtered.length} of {crs.length} records shown</p>
    </div>
  )
}
