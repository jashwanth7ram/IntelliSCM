import { useEffect, useState, Fragment } from 'react'
import { cisAPI, projectsAPI } from '../../services/api'
import {
  FaLayerGroup, FaPlus, FaSearch, FaHistory, FaArchive,
  FaCodeBranch, FaFileCode, FaDatabase, FaTools, FaCog,
  FaFileAlt, FaVial, FaChevronDown, FaChevronUp
} from 'react-icons/fa'

const TYPE_ICONS = {
  'Source Code':        FaFileCode,
  'Document':           FaFileAlt,
  'Binary':             FaCog,
  'Config File':        FaTools,
  'Test Suite':         FaVial,
  'Database Schema':    FaDatabase,
  'Infrastructure':     FaLayerGroup,
}

const STATUS_COLORS = {
  Active:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Deprecated:   'text-amber-400  bg-amber-400/10  border-amber-400/20',
  Archived:     'text-zinc-400   bg-zinc-400/10   border-zinc-400/20',
  'Under Change':'text-primary   bg-primary/10    border-primary/20',
}

const CI_TYPES = ['Source Code','Document','Binary','Config File','Test Suite','Database Schema','Infrastructure']

const BLANK = { name: '', type: 'Source Code', description: '', filePath: '', currentVersion: '1.0.0', project: '' }

export default function CIRegistry() {
  const [cis, setCIs]           = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState({ type: '', text: '' })
  const [expandedCI, setExpandedCI] = useState(null)

  const setF = (k) => (e) => setForm(x => ({ ...x, [k]: e.target.value }))

  useEffect(() => {
    Promise.all([
      cisAPI.list(),
      projectsAPI.list()
    ]).then(([c, p]) => {
      setCIs(c.data || [])
      setProjects(p.data || [])
    }).catch(() => {
      setMsg({ type: 'error', text: 'Failed to load CI Registry.' })
    }).finally(() => setLoading(false))
  }, [])

  const filtered = cis.filter(ci => {
    const q = search.toLowerCase()
    const matchSearch = !q || ci.name?.toLowerCase().includes(q) || ci.ciId?.toLowerCase().includes(q) || ci.filePath?.toLowerCase().includes(q)
    const matchType    = !filterType    || ci.type    === filterType
    const matchStatus  = !filterStatus  || ci.status  === filterStatus
    const matchProject = !filterProject || ci.project?._id === filterProject
    return matchSearch && matchType && matchStatus && matchProject
  })

  const stats = {
    total:      cis.length,
    active:     cis.filter(c => c.status === 'Active').length,
    underChange:cis.filter(c => c.status === 'Under Change').length,
    deprecated: cis.filter(c => c.status === 'Deprecated').length,
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg({ type: '', text: '' })
    try {
      const r = await cisAPI.create(form)
      setCIs(prev => [r.data, ...prev])
      setShowForm(false); setForm(BLANK)
      setMsg({ type: 'success', text: `CI ${r.data.ciId} registered successfully.` })
      setTimeout(() => setMsg({ type: '', text: '' }), 4000)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to register CI.' })
    } finally { setSaving(false) }
  }

  const handleArchive = async (id) => {
    try {
      await cisAPI.archive(id)
      setCIs(prev => prev.map(c => c._id === id ? { ...c, status: 'Archived' } : c))
    } catch {
      setMsg({ type: 'error', text: 'Failed to archive CI.' })
    }
  }

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto w-full min-w-0">

      {/* Header */}
      <div className="mb-12 pt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <FaLayerGroup size={14} />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">IEEE 828 §5.2</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3">
            CI Registry
          </h1>
          <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
            Configuration Item identification, versioning, and ownership. Every software artifact tracked in one place.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(168,127,243,0.4)] whitespace-nowrap"
        >
          <FaPlus size={12} /> Register CI
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total CIs',     value: stats.total,       color: 'text-white' },
          { label: 'Active',        value: stats.active,      color: 'text-emerald-400' },
          { label: 'Under Change',  value: stats.underChange, color: 'text-primary' },
          { label: 'Deprecated',    value: stats.deprecated,  color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className={`text-3xl font-black tracking-tight mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-textMuted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feedback Messages */}
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

      {/* Register CI Form */}
      {showForm && (
        <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-10 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          <h3 className="text-xl font-bold text-white tracking-tight mb-6">Register Configuration Item</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">CI Name *</label>
                <input
                  type="text" required
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors"
                  placeholder="e.g. Auth Service Module"
                  value={form.name} onChange={setF('name')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Type *</label>
                <select
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors"
                  value={form.type} onChange={setF('type')}
                >
                  {CI_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project *</label>
                <select
                  required
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors"
                  value={form.project} onChange={setF('project')}
                >
                  <option value="" className="bg-zinc-900">Select project...</option>
                  {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Initial Version</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors"
                  placeholder="1.0.0"
                  value={form.currentVersion} onChange={setF('currentVersion')}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">File / Artifact Path</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors"
                  placeholder="src/auth/authService.js"
                  value={form.filePath} onChange={setF('filePath')}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Description</label>
                <textarea
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-3 rounded-xl outline-none text-sm min-h-[80px] placeholder-zinc-700 shadow-inner transition-colors resize-y"
                  placeholder="Describe the purpose, scope and dependencies of this CI..."
                  value={form.description} onChange={setF('description')}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                type="submit" disabled={saving}
                className="bg-primary hover:bg-primaryHover text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,127,243,0.4)]"
              >
                {saving ? 'Registering...' : 'Register CI'}
              </button>
              <button
                type="button"
                className="bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
                onClick={() => { setShowForm(false); setForm(BLANK) }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm placeholder-zinc-600 transition-colors"
            placeholder="Search by name, CI ID, path..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { label: 'All Types',   value: filterType,    setter: setFilterType,    options: CI_TYPES },
          { label: 'All Statuses', value: filterStatus, setter: setFilterStatus,  options: ['Active','Under Change','Deprecated','Archived'] },
        ].map(({ label, value, setter, options }) => (
          <select
            key={label}
            className="bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
            value={value} onChange={e => setter(e.target.value)}
          >
            <option value="" className="bg-zinc-900">{label}</option>
            {options.map(o => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
          </select>
        ))}
        <select
          className="bg-white/[0.02] border border-white/[0.05] focus:border-primary/30 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none transition-colors"
          value={filterProject} onChange={e => setFilterProject(e.target.value)}
        >
          <option value="" className="bg-zinc-900">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>)}
        </select>
      </div>

      {/* CI Table — min-w-0 + overflow-x-auto so wide tables scroll inside flex layout */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl min-w-0 max-w-full">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <span className="loading loading-spinner text-primary loading-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <FaLayerGroup size={32} className="opacity-30 mb-4" />
            <p className="text-sm font-medium text-white/30">
              {cis.length === 0 ? 'No configuration items registered yet.' : 'No CIs match your filters.'}
            </p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-scroll sm:overflow-x-auto overscroll-x-contain touch-pan-x rounded-2xl [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[920px] w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                  <th className="px-6 py-4">CI ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/[0.02]">
                {filtered.map(ci => {
                  const TypeIcon = TYPE_ICONS[ci.type] || FaFileCode
                  const isExpanded = expandedCI === ci._id
                  return (
                    <Fragment key={ci._id}>
                      <tr
                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => setExpandedCI(isExpanded ? null : ci._id)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                            {ci.ciId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{ci.name}</span>
                            {ci.filePath && <span className="text-xs text-zinc-500 font-mono mt-0.5">{ci.filePath}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-textMuted">
                            <TypeIcon size={13} className="text-primary/70" />
                            <span className="text-xs">{ci.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <FaCodeBranch size={11} className="text-zinc-500" />
                            <span className="font-mono text-sm text-white font-semibold">v{ci.currentVersion}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-textMuted">{ci.project?.name || '—'}</td>
                        <td className="px-6 py-4 text-textMuted">{ci.owner?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[ci.status] || STATUS_COLORS.Active}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {ci.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Version History"
                              className="text-xs text-primary hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
                              onClick={e => { e.stopPropagation(); setExpandedCI(isExpanded ? null : ci._id) }}
                            >
                              <FaHistory size={11} />
                            </button>
                            {ci.status !== 'Archived' && (
                              <button
                                title="Archive CI"
                                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-400/5 transition-all"
                                onClick={e => { e.stopPropagation(); handleArchive(ci._id) }}
                              >
                                <FaArchive size={11} />
                              </button>
                            )}
                            {isExpanded
                              ? <FaChevronUp size={11} className="text-zinc-500" />
                              : <FaChevronDown size={11} className="text-zinc-500" />
                            }
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Version History */}
                      {isExpanded && (
                        <tr key={`${ci._id}-history`}>
                          <td colSpan={8} className="px-6 pb-6 pt-0 bg-black/20">
                            <div className="border border-white/[0.05] rounded-xl p-5 mt-1">
                              <div className="flex items-center gap-2 mb-4">
                                <FaHistory size={12} className="text-primary" />
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">Version History</span>
                              </div>
                              {!ci.versionHistory || ci.versionHistory.length === 0 ? (
                                <p className="text-xs text-zinc-600">No version history recorded.</p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {ci.versionHistory.map((v, idx) => (
                                    <div key={idx} className="flex items-start gap-4 text-xs">
                                      <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
                                        v{v.version}
                                      </span>
                                      <span className="text-textMuted flex-1">{v.changeDescription || '—'}</span>
                                      <span className="text-zinc-600 shrink-0">
                                        {v.changedBy?.name || '—'} · {v.changedAt ? new Date(v.changedAt).toLocaleDateString() : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {ci.description && (
                                <p className="text-xs text-zinc-500 mt-4 pt-4 border-t border-white/[0.04]">{ci.description}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600 text-right mt-3 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-1 sm:gap-3">
        <span className="text-zinc-500 sm:order-2">{filtered.length} of {cis.length} configuration items shown</span>
        {filtered.length > 0 && (
          <span className="text-zinc-600 sm:order-1">Scroll horizontally if columns are clipped.</span>
        )}
      </p>
    </div>
  )
}
