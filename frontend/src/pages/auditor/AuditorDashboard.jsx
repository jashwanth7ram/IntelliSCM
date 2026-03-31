import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { baselinesAPI, auditsAPI, crsAPI, projectsAPI } from '../../services/api'
import { FaCheckSquare, FaPlus, FaSearch, FaShieldAlt, FaCodeBranch, FaRegFileAlt } from 'react-icons/fa'

const AUDIT_TYPES = ['FCA', 'PCA']

const STATUS_COLORS = {
  Submitted:           'text-blue-400    bg-blue-400/10    border-blue-400/20',
  'Under Review':      'text-amber-400   bg-amber-400/10   border-amber-400/20',
  Approved:            'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Rejected:            'text-red-400     bg-red-400/10     border-red-400/20',
  'Needs Modification':'text-orange-400  bg-orange-400/10  border-orange-400/20',
  'Emergency Fix':     'text-purple-400  bg-purple-400/10  border-purple-400/20',
}

const inputCls  = 'w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors'
const selectCls = 'w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors'

export default function AuditorDashboard() {
  const location = useLocation()
  const isBaselinesView = location.pathname === '/auditor/baselines'

  const [crs, setCrs]           = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ type: '', text: '' })

  // Filters (only for CR view)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')

  // Baseline form state
  const [baseline, setBaseline] = useState({ versionNumber: '', description: '', project: '' })
  const [bLoading, setBLoading] = useState(false)

  // Audit form state
  const [audit, setAudit]   = useState({ auditType: 'FCA', auditDate: '', notes: '', project: '' })
  const [aLoading, setALoading] = useState(false)

  useEffect(() => {
    Promise.all([crsAPI.list(), projectsAPI.list()])
      .then(([c, p]) => { setCrs(c.data || []); setProjects(p.data || []) })
      .catch(() => flash('error', 'Failed to load data.'))
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
      flash('success', '✓ Baseline committed successfully.')
      setBaseline({ versionNumber: '', description: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to create baseline.')
    } finally { setBLoading(false) }
  }

  const scheduleAudit = async (e) => {
    e.preventDefault(); setALoading(true)
    try {
      const { notes, ...rest } = audit
      await auditsAPI.create({ ...rest, complianceNotes: notes })
      flash('success', '✓ Audit scheduled successfully.')
      setAudit({ auditType: 'FCA', auditDate: '', notes: '', project: '' })
    } catch (err) {
      flash('error', err.response?.data?.error || err.response?.data?.message || 'Failed to schedule audit.')
    } finally { setALoading(false) }
  }

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

  // ─── BASELINES VIEW ───────────────────────────────────────────
  if (isBaselinesView) {
    return (
      <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1200px] mx-auto">
        <div className="mb-10 pt-8">
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3">Baselines & Audits</h1>
          <p className="text-lg text-textMuted leading-relaxed">Create configuration baselines and schedule formal compliance audits.</p>
        </div>

        {msg.text && (
          <div className={`px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Baseline Form ── */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-primary/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
            <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2 relative z-10">
              <FaRegFileAlt className="text-primary" /> Snapshot Baseline
            </h2>
            <form onSubmit={createBaseline} className="flex flex-col gap-5 relative z-10">
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
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description *</label>
                <textarea className={`${inputCls} min-h-[80px] resize-y`}
                  placeholder="Describe the state of this baseline..."
                  value={baseline.description} onChange={setB('description')} required />
              </div>
              <button type="submit"
                className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)] disabled:opacity-50 mt-2"
                disabled={bLoading}>
                {bLoading ? 'Saving...' : 'Commit Baseline'}
              </button>
            </form>
          </div>

          {/* ── Schedule Audit Form ── */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
            <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-2 relative z-10">
              <FaShieldAlt className="text-blue-400" /> Schedule Audit
            </h2>
            <form onSubmit={scheduleAudit} className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Audit Type *</label>
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
                {/* colorScheme: dark fixes the native date picker on dark backgrounds */}
                <input
                  type="date"
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
                  value={audit.auditDate}
                  onChange={setA('auditDate')}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Compliance Notes</label>
                <textarea className={`${inputCls} min-h-[60px] resize-y`}
                  placeholder="Objectives of this audit..."
                  value={audit.notes} onChange={setA('notes')} />
              </div>
              <button type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 mt-2"
                disabled={aLoading}>
                {aLoading ? 'Scheduling...' : 'Schedule Audit'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ─── AUDIT DASHBOARD VIEW (CR Trail) ──────────────────────────
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
