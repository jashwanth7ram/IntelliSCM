import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI, projectsAPI } from '../../services/api'
import {
  FaCheckSquare, FaPlus, FaFilter, FaSearch,
  FaShieldAlt, FaCodeBranch, FaRegFileAlt
} from 'react-icons/fa'

const AUDIT_TYPES = ['FCA', 'PCA']

const STATUS_COLORS = {
  Submitted:          'text-blue-400   bg-blue-400/10   border-blue-400/20',
  'Under Review':     'text-amber-400  bg-amber-400/10  border-amber-400/20',
  Approved:           'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Rejected:           'text-red-400    bg-red-400/10    border-red-400/20',
  'Needs Modification':'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Emergency Fix':    'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default function AuditorDashboard() {
  const location = useLocation()
  const isBaselinesView = location.pathname === '/auditor/baselines'

  const [crs, setCrs]           = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ type: '', text: '' })

  // Filters
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')

  // Baseline form
  const [showBaseline, setShowBaseline] = useState(false)
  const [baseline, setBaseline] = useState({ versionNumber: '', description: '', project: '' })
  const [bLoading, setBLoading] = useState(false)

  // Audit form
  const [showAudit, setShowAudit] = useState(false)
  const [audit, setAudit]         = useState({ auditType: 'FCA', auditDate: '', notes: '', project: '' })
  const [aLoading, setALoading]   = useState(false)

  useEffect(() => {
    Promise.all([crsAPI.list(), projectsAPI.list()])
      .then(([c, p]) => {
        setCrs(c.data || [])
        setProjects(p.data || [])
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load data.' }))
      .finally(() => setLoading(false))
  }, [])

  const setB = (k) => (e) => setBaseline(x => ({ ...x, [k]: e.target.value }))
  const setA = (k) => (e) => setAudit(x => ({ ...x, [k]: e.target.value }))

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const createBaseline = async (e) => {
    e.preventDefault(); setBLoading(true)
    try {
      await baselinesAPI.create(baseline)
      flash('success', 'Baseline committed successfully.')
      setShowBaseline(false)
      setBaseline({ versionNumber: '', description: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to create baseline.')
    } finally { setBLoading(false) }
  }

  const scheduleAudit = async (e) => {
    e.preventDefault(); setALoading(true)
    try {
      // Map 'notes' form field → 'complianceNotes' schema field
      const { notes, ...rest } = audit
      await auditsAPI.create({ ...rest, complianceNotes: notes })
      flash('success', 'Audit scheduled successfully.')
      setShowAudit(false)
      setAudit({ auditType: 'FCA', auditDate: '', notes: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to schedule audit.')
    } finally { setALoading(false) }
  }

  // Stats
  const approved    = crs.filter(c => c.status === 'Approved').length
  const pending     = crs.filter(c => ['Submitted', 'Under Review'].includes(c.status)).length
  const rejected    = crs.filter(c => c.status === 'Rejected').length
  const needsMod    = crs.filter(c => c.status === 'Needs Modification').length

  // Filtered CRs
  const filtered = crs.filter(cr => {
    const q = search.toLowerCase()
    const matchSearch  = !q || cr.title?.toLowerCase().includes(q) || cr.submittedBy?.name?.toLowerCase().includes(q)
    const matchStatus  = !filterStatus  || cr.status  === filterStatus
    const matchProject = !filterProject || cr.project?._id === filterProject
    return matchSearch && matchStatus && matchProject
  })

  const inputCls  = "w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors"
  const selectCls = "w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors"

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-10 pt-8 flex flex-col sm:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3">
            {isBaselinesView ? 'Baselines & Audits' : 'Audit Dashboard'}
          </h1>
          <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
            {isBaselinesView
              ? 'Create configuration baselines and schedule formal compliance audits.'
              : 'Full change trail visibility across all projects and teams.'}
          </p>
        </div>
        {/* Action buttons always visible */}
        <div className="flex gap-3 shrink-0 pt-2">
          <button
            className="bg-primary hover:bg-primaryHover text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(168,127,243,0.3)]"
            onClick={() => { setShowBaseline(s => !s); setShowAudit(false) }}
          >
            <FaPlus size={11} /> Snapshot Baseline
          </button>
          <button
            className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2"
            onClick={() => { setShowAudit(s => !s); setShowBaseline(false) }}
          >
            <FaCheckSquare size={11} /> Schedule Audit
          </button>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total CRs',      value: crs.length,  color: 'text-white' },
          { label: 'Approved',       value: approved,    color: 'text-emerald-400' },
          { label: 'Pending Review', value: pending,     color: 'text-amber-400' },
          { label: 'Rejected',       value: rejected,    color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className={`text-3xl font-black tracking-tight mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-textMuted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {msg.text && (
        <div className={`px-6 py-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${msg.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {msg.text}
        </div>
      )}

      {/* Forms — shown on both views, toggled by header buttons */}
      <div className="mb-6">
          {/* Baseline Form */}
          {showBaseline && (
            <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                <FaRegFileAlt className="text-primary" /> Create Configuration Baseline
              </h3>
              <form onSubmit={createBaseline} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Version Tag *</label>
                  <input type="text" className={inputCls} placeholder="v1.4.2-stable"
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
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description</label>
                  <textarea className={`${inputCls} min-h-[80px] resize-y`}
                    placeholder="Define the state of the baseline..."
                    value={baseline.description} onChange={setB('description')} />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]" disabled={bLoading}>
                    {bLoading ? 'Saving...' : 'Commit Baseline'}
                  </button>
                  <button type="button" className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
                    onClick={() => setShowBaseline(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Audit Form */}
          {showAudit && (
            <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                <FaShieldAlt className="text-primary" /> Schedule Compliance Audit
              </h3>
              <form onSubmit={scheduleAudit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Protocol</label>
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
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Scheduled Date *</label>
                  <input type="date" className={inputCls}
                    value={audit.auditDate} onChange={setA('auditDate')} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Notes</label>
                  <input type="text" className={inputCls} placeholder="Audit objectives..."
                    value={audit.notes} onChange={setA('notes')} />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]" disabled={aLoading}>
                    {aLoading ? 'Saving...' : 'Confirm Audit Date'}
                  </button>
                  <button type="button" className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
                    onClick={() => setShowAudit(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
      </div>

      {/* CR Audit Trail — always visible */}
      <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm placeholder-zinc-600 transition-colors"
                placeholder="Search by title or submitter..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="" className="bg-zinc-900">All Statuses</option>
              {['Submitted','Under Review','Approved','Rejected','Needs Modification','Emergency Fix'].map(s => (
                <option key={s} value={s} className="bg-zinc-900">{s}</option>
              ))}
            </select>
            <select
              className="bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
              value={filterProject} onChange={e => setFilterProject(e.target.value)}
            >
              <option value="" className="bg-zinc-900">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
            </select>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <span className="loading loading-spinner text-primary loading-lg" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                <FaCodeBranch size={28} className="opacity-30 mb-4" />
                <p className="text-sm font-medium text-white/30">No change requests match the current filters.</p>
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
                            cr.riskScore === 'High'   ? 'text-red-400    bg-red-400/10    border-red-400/20'   :
                            cr.riskScore === 'Medium' ? 'text-amber-400  bg-amber-400/10  border-amber-400/20' :
                                                        'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
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
    </div>
  )
}
