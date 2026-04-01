import { useState, useEffect } from 'react'
import { crsAPI, projectsAPI } from '../../services/api'
import { FaPaperPlane, FaFolderOpen, FaBrain, FaChevronDown } from 'react-icons/fa6'
import { useNavigate } from 'react-router-dom'

const DEFAULT_ML = {
  v_g: '', ev_g: '', iv_g: '', branchCount: '',
  uniq_Op: '', uniq_Opnd: '', total_Op: '', total_Opnd: '',
  lOComment: '', lOBlank: '', locCodeAndComment: '',
}

export default function SubmitCR() {
  const [form, setForm] = useState({
    title: '', description: '', changeType: 'Feature',
    priorityLevel: 'Medium', repositoryUrl: '', branchName: '',
    linesOfCodeModified: '', project: '', plannedStart: '', plannedEnd: '', environment: 'Production'
  })
  const [mlMetrics, setMlMetrics] = useState(DEFAULT_ML)
  const [mlOpen, setMlOpen]       = useState(false)
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [loadingProj, setLoadingProj] = useState(true)
  const [msg, setMsg]         = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    projectsAPI.list()
      .then(r => setProjects(r.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProj(false))
  }, [])

  const set    = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setML  = (k) => (e) => setMlMetrics(m => ({ ...m, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.project) { setErrorMsg('Please select a project.'); return }
    setLoading(true); setMsg(''); setErrorMsg('')
    try {
      // Only include mlMetrics fields that were actually filled in
      const cleanML = Object.fromEntries(
        Object.entries(mlMetrics).filter(([, v]) => v !== '' && !isNaN(Number(v)))
          .map(([k, v]) => [k, Number(v)])
      )
      await crsAPI.create({
        ...form,
        linesOfCodeModified: Number(form.linesOfCodeModified) || 0,
        mlMetrics: Object.keys(cleanML).length > 0 ? cleanML : undefined,
      })
      setMsg('Change request successfully submitted for AI analysis.')
      setTimeout(() => navigate('/developer'), 2000)
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Failed to submit CR.')
      setLoading(false)
    }
  }

  const inputCls  = "w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white px-5 py-4 rounded-xl outline-none text-base placeholder-zinc-600 shadow-inner"
  const selectCls = "w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-base appearance-none shadow-inner"
  const mlInputCls = "w-full bg-black/30 border border-white/[0.08] focus:border-primary/40 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner"

  const ML_FIELDS = [
    { k: 'v_g',              label: 'Cyclomatic Complexity v(g)',   hint: 'McCabe complexity — branches + 1' },
    { k: 'ev_g',             label: 'Essential Complexity ev(g)',   hint: 'Structured control-flow metric' },
    { k: 'iv_g',             label: 'Design Complexity iv(g)',      hint: 'Design-level complexity' },
    { k: 'branchCount',      label: 'Branch Count',                 hint: 'Total if/else/switch branches' },
    { k: 'uniq_Op',          label: 'Unique Operators',             hint: 'Distinct operators used' },
    { k: 'uniq_Opnd',        label: 'Unique Operands',              hint: 'Distinct operands used' },
    { k: 'total_Op',         label: 'Total Operators',              hint: 'All operator occurrences' },
    { k: 'total_Opnd',       label: 'Total Operands',               hint: 'All operand occurrences' },
    { k: 'lOComment',        label: 'Lines of Comments',            hint: 'Comment line count' },
    { k: 'lOBlank',          label: 'Blank Lines',                  hint: 'Blank line count' },
    { k: 'locCodeAndComment', label: 'Code + Comment Lines',        hint: 'Lines with both code and comment' },
  ]

  const filledCount = Object.values(mlMetrics).filter(v => v !== '').length

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1000px] mx-auto">
      <div className="mb-12 pt-8">
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          Submit Request
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Propose code modifications for the deployment pipeline. Every change is tracked and evaluated by the ML model.
        </p>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        {msg      && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-400" />{msg}</div>}
        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-400" />{errorMsg}</div>}

        <form onSubmit={submit} className="flex flex-col gap-8 relative z-10">

          {/* Project Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted flex items-center gap-2">
              <FaFolderOpen size={13} className="text-primary/70" /> Project *
            </label>
            {loadingProj ? (
              <div className="w-full py-4 px-5 rounded-xl border border-white/[0.1] bg-black/40 text-zinc-500 text-sm">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="w-full py-4 px-5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
                No projects available. Ask your Project Manager to create one first.
              </div>
            ) : (
              <select className={selectCls} value={form.project} onChange={set('project')} required>
                <option value="" className="bg-zinc-900">Select a project...</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted">Title *</label>
            <input type="text" className={inputCls}
              placeholder="e.g. Implement OAuth2 Login Provider"
              value={form.title} onChange={set('title')} required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted">Description *</label>
            <textarea className={`${inputCls} min-h-[160px] resize-y leading-relaxed`}
              placeholder="Provide context and technical details about the proposed changes..."
              value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Change Type</label>
              <select className={selectCls} value={form.changeType} onChange={set('changeType')}>
                {['Feature','Bug Fix','Refactor','Security','Performance','Infrastructure'].map(t => (
                  <option key={t} value={t} className="bg-zinc-900">{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Priority</label>
              <select className={selectCls} value={form.priorityLevel} onChange={set('priorityLevel')}>
                {['Low','Medium','High','Critical'].map(p => (
                  <option key={p} value={p} className="bg-zinc-900">{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Planned Start</label>
              <input type="datetime-local" className={inputCls}
                value={form.plannedStart} onChange={set('plannedStart')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Planned End</label>
              <input type="datetime-local" className={inputCls}
                value={form.plannedEnd} onChange={set('plannedEnd')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Environment</label>
              <select className={selectCls} value={form.environment} onChange={set('environment')}>
                {['Production', 'Staging', 'Development'].map(env => (
                  <option key={env} value={env} className="bg-zinc-900">{env}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Repository URL</label>
              <input type="url" className={inputCls}
                placeholder="https://github.com/org/repo"
                value={form.repositoryUrl} onChange={set('repositoryUrl')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Branch</label>
              <input type="text" className={inputCls}
                placeholder="feature/new-login"
                value={form.branchName} onChange={set('branchName')} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted">
              Lines of Code Modified <span className="text-zinc-600 font-normal">(for AI risk scoring)</span>
            </label>
            <input type="number" min="0" className={inputCls}
              placeholder="e.g. 250"
              value={form.linesOfCodeModified} onChange={set('linesOfCodeModified')} />
          </div>

          {/* ── ML Code Metrics (collapsible) ── */}
          <div className="border border-primary/20 rounded-2xl overflow-hidden bg-primary/[0.02]">
            <button
              type="button"
              onClick={() => setMlOpen(o => !o)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FaBrain className="text-primary" size={16} />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">ML Code Metrics</p>
                  <p className="text-xs text-textMuted mt-0.5">
                    Optional — helps ML Insights auto-populate your CR for deeper defect analysis
                    {filledCount > 0 && <span className="ml-2 text-primary font-semibold">({filledCount} filled)</span>}
                  </p>
                </div>
              </div>
              <FaChevronDown
                size={14}
                className={`text-textMuted transition-transform duration-200 ${mlOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {mlOpen && (
              <div className="px-6 pb-6 border-t border-white/[0.05]">
                <p className="text-xs text-textMuted py-4 leading-relaxed">
                  These metrics are used by the ML model to predict defect probability. You can get these values from
                  a static analysis tool (e.g. Lizard, SonarQube, Radon). All fields are optional.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ML_FIELDS.map(({ k, label, hint }) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-textMuted">{label}</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={mlInputCls}
                        placeholder={hint}
                        value={mlMetrics[k]}
                        onChange={setML(k)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/[0.05] mt-2">
            <button
              type="submit"
              className="bg-primary hover:bg-primaryHover text-white font-semibold py-4 px-8 rounded-xl transition-all text-base flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(168,127,243,0.4)] disabled:opacity-50"
              disabled={loading || projects.length === 0}
            >
              {loading ? 'Processing...' : <><FaPaperPlane /> Submit Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
