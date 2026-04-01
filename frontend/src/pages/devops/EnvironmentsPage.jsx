import { useEffect, useState } from 'react'
import { deploymentsAPI, projectsAPI } from '../../services/api'

const ENVS = ['Development', 'QA', 'Staging', 'Production']

export default function EnvironmentsPage() {
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState('')
  const [summary, setSummary] = useState({})
  const [recent, setRecent] = useState([])
  const [form, setForm] = useState({
    environment: 'Staging',
    versionLabel: '',
    changeRequest: '',
    release: '',
    notes: '',
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const params = {}
      if (project) params.project = project
      const [sum, list] = await Promise.all([
        deploymentsAPI.envSummary(params),
        deploymentsAPI.list(params),
      ])
      setSummary(sum.data || {})
      setRecent(list.data || [])
    } catch (e) {
      setErr(e.response?.data?.error || 'Load failed')
    }
  }

  useEffect(() => {
    projectsAPI.list().then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [project])

  const deploy = async e => {
    e.preventDefault()
    setErr('')
    try {
      await deploymentsAPI.create({
        project,
        environment: form.environment,
        versionLabel: form.versionLabel || undefined,
        changeRequest: form.changeRequest || undefined,
        release: form.release || undefined,
        notes: form.notes,
      })
      setMsg('Deployment recorded')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  const setStatus = async (id, status) => {
    try {
      await deploymentsAPI.updateStatus(id, { status })
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Update failed')
    }
  }

  return (
    <div className="space-y-8">
      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">{msg}</div>}
      {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{err}</div>}

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-textMuted uppercase font-semibold block mb-2">Project filter</label>
          <select className="bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm min-w-[200px]" value={project} onChange={e => setProject(e.target.value)}>
            <option value="">All</option>
            {projects.map(p => (
              <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ENVS.map(env => {
          const dep = summary[env]
          return (
            <div key={env} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
              <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{env}</div>
              {dep ? (
                <>
                  <div className="text-white font-bold text-sm">{dep.status}</div>
                  <div className="text-xs text-zinc-500 mt-1">{dep.versionLabel || '—'}</div>
                  <div className="text-xs text-zinc-600 mt-2">{dep.deployedAt ? new Date(dep.deployedAt).toLocaleString() : ''}</div>
                </>
              ) : (
                <div className="text-sm text-zinc-600">No deployments</div>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={deploy} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-bold text-white">Log deployment</h2>
        <select required className="w-full bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={project} onChange={e => setProject(e.target.value)}>
          <option value="">Project *</option>
          {projects.map(p => (
            <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
          ))}
        </select>
        <select className="w-full bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
          {ENVS.map(e => (
            <option key={e} value={e} className="bg-zinc-900">{e}</option>
          ))}
        </select>
        <input className="w-full bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" placeholder="Version label (e.g. v1.2.0)" value={form.versionLabel} onChange={e => setForm(f => ({ ...f, versionLabel: e.target.value }))} />
        <input className="w-full bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" placeholder="CR id (optional)" value={form.changeRequest} onChange={e => setForm(f => ({ ...f, changeRequest: e.target.value }))} />
        <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-3 rounded-xl text-sm" disabled={!project}>Record deployment</button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Recent deployments</h2>
        <div className="overflow-x-auto bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] text-xs text-textMuted uppercase">
                <th className="px-4 py-3 text-left">Env</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 30).map(d => (
                <tr key={d._id} className="border-b border-white/[0.03]">
                  <td className="px-4 py-3 text-white">{d.environment}</td>
                  <td className="px-4 py-3 text-textMuted">{d.status}</td>
                  <td className="px-4 py-3 text-textMuted">{d.versionLabel || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button type="button" className="text-emerald-400 text-xs" onClick={() => setStatus(d._id, 'success')}>Success</button>
                    <button type="button" className="text-red-400 text-xs" onClick={() => setStatus(d._id, 'failed')}>Fail</button>
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
