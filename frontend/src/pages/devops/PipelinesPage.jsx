import { useEffect, useState } from 'react'
import { pipelinesAPI, projectsAPI, crsAPI } from '../../services/api'

const yamlPlaceholder = `stages:
  - build
  - test
  - deploy
`

export default function PipelinesPage() {
  const [projects, setProjects] = useState([])
  const [defs, setDefs] = useState([])
  const [runs, setRuns] = useState([])
  const [crs, setCrs] = useState([])
  const [proj, setProj] = useState('')
  const [name, setName] = useState('default')
  const [yaml, setYaml] = useState(yamlPlaceholder)
  const [crId, setCrId] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const [d, r, c] = await Promise.all([
        pipelinesAPI.listDefinitions(proj ? { project: proj } : {}),
        pipelinesAPI.listRuns(proj ? { project: proj } : {}),
        crsAPI.list(),
      ])
      setDefs(d.data || [])
      setRuns(r.data || [])
      setCrs(c.data || [])
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load')
    }
  }

  useEffect(() => {
    projectsAPI.list().then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [proj])

  const createDef = async e => {
    e.preventDefault()
    setErr('')
    try {
      const r = await pipelinesAPI.createDefinition({ project: proj, name, yamlSource: yaml, isDefault: true })
      setMsg(r.status === 200 ? 'Pipeline definition updated' : 'Pipeline definition saved')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Save failed')
    }
  }

  const startRun = async () => {
    setErr('')
    try {
      await pipelinesAPI.startRun({ crId })
      setMsg('Pipeline run started')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Start failed')
    }
  }

  const advance = async id => {
    try {
      await pipelinesAPI.advanceRun(id, {})
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Advance failed')
    }
  }

  const sim = async id => {
    try {
      await pipelinesAPI.simulateSuccess(id)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Simulate failed')
    }
  }

  return (
    <div className="space-y-8">
      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">{msg}</div>}
      {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{err}</div>}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-textMuted leading-relaxed">
        <p className="text-white font-semibold mb-1">What is this?</p>
        <p>
          A <strong className="text-zinc-300">pipeline</strong> is a simulated CI/CD workflow (build → test → deploy). The YAML here only
          defines <strong className="text-zinc-300">stage names</strong>; IntelliSCM does not run real servers—it uses them when you{' '}
          <strong className="text-zinc-300">Start pipeline</strong> on a CR, then <strong className="text-zinc-300">Advance</strong> or{' '}
          <strong className="text-zinc-300">Simulate all OK</strong> to move stages. Saving the same project + name <strong className="text-zinc-300">updates</strong> the definition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={createDef} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Pipeline definition</h2>
          <div>
            <label className="text-xs text-textMuted uppercase font-semibold">Project *</label>
            <select
              required
              className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm"
              value={proj}
              onChange={e => setProj(e.target.value)}
            >
              <option value="">Select…</option>
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase font-semibold">Name</label>
            <input className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase font-semibold">YAML-like stages</label>
            <textarea
              className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm font-mono min-h-[160px]"
              value={yaml}
              onChange={e => setYaml(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-3 rounded-xl text-sm">
            Save definition
          </button>
        </form>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Start run for CR</h2>
          <select
            className="w-full bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm"
            value={crId}
            onChange={e => setCrId(e.target.value)}
          >
            <option value="">Select CR…</option>
            {crs.map(c => (
              <option key={c._id} value={c._id} className="bg-zinc-900">{c.title?.slice(0, 60)}</option>
            ))}
          </select>
          <button type="button" onClick={startRun} disabled={!crId} className="bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-50">
            Start pipeline
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Recent runs</h2>
        <div className="overflow-x-auto bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/[0.05] text-xs text-textMuted uppercase">
                <th className="px-4 py-3">CR</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stages</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run._id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{run.changeRequest?.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full border border-white/10">{run.overallStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-textMuted text-xs">
                    {(run.stages || []).map(s => `${s.name}:${s.status}`).join(' → ')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button type="button" className="text-primary text-xs font-semibold" onClick={() => advance(run._id)}>Advance</button>
                    <button type="button" className="text-emerald-400 text-xs font-semibold" onClick={() => sim(run._id)}>Simulate all OK</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && <p className="p-8 text-center text-textMuted text-sm">No pipeline runs yet.</p>}
        </div>
      </div>
    </div>
  )
}
