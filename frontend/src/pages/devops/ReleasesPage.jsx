import { useEffect, useState } from 'react'
import { releasesAPI, projectsAPI, crsAPI } from '../../services/api'

export default function ReleasesPage() {
  const [projects, setProjects] = useState([])
  const [list, setList] = useState([])
  const [crs, setCrs] = useState([])
  const [project, setProject] = useState('')
  const [version, setVersion] = useState('v1.0.0')
  const [title, setTitle] = useState('')
  const [selectedCrs, setSelectedCrs] = useState([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const [rel, c] = await Promise.all([
        releasesAPI.list(project ? { project } : {}),
        crsAPI.list(),
      ])
      setList(rel.data || [])
      setCrs(c.data || [])
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

  const create = async e => {
    e.preventDefault()
    setErr('')
    try {
      await releasesAPI.create({
        project,
        version,
        title: title || `Release ${version}`,
        changeRequestIds: selectedCrs,
      })
      setMsg('Release created')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Create failed')
    }
  }

  const genNotes = async id => {
    try {
      await releasesAPI.generateNotes(id)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  const submitApproval = async id => {
    try {
      await releasesAPI.submitApproval(id)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  const approve = async id => {
    try {
      await releasesAPI.approve(id)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  const markReleased = async id => {
    try {
      await releasesAPI.markReleased(id)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  const toggleCr = id => {
    setSelectedCrs(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-8">
      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">{msg}</div>}
      {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{err}</div>}

      <form onSubmit={create} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Create release</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-textMuted uppercase font-semibold">Project *</label>
            <select required className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={project} onChange={e => setProject(e.target.value)}>
              <option value="">Select…</option>
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase font-semibold">Version *</label>
            <input required className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={version} onChange={e => setVersion(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-textMuted uppercase font-semibold">Title</label>
          <input className="w-full mt-1 bg-black/40 border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder={`Release ${version}`} />
        </div>
        <div>
          <label className="text-xs text-textMuted uppercase font-semibold mb-2 block">Include CRs</label>
          <div className="max-h-40 overflow-y-auto border border-white/[0.06] rounded-xl p-2 space-y-1">
            {crs.filter(c => !project || (c.project?._id || c.project) === project).map(c => (
              <label key={c._id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={selectedCrs.includes(c._id)} onChange={() => toggleCr(c._id)} />
                <span className="truncate">{c.title}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-3 rounded-xl text-sm">Create release</button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Releases</h2>
        <div className="space-y-4">
          {list.map(rel => (
            <div key={rel._id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-white font-bold">{rel.version} <span className="text-textMuted font-normal text-sm ml-2">{rel.status}</span></div>
                <div className="text-sm text-textMuted mt-1">{(rel.changeRequests || []).length} CR(s)</div>
                {rel.releaseNotes && (
                  <pre className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap max-h-24 overflow-hidden">{rel.releaseNotes.slice(0, 200)}…</pre>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:bg-white/[0.05]" onClick={() => genNotes(rel._id)}>Generate notes</button>
                <button type="button" className="text-xs px-3 py-2 rounded-lg border border-amber-500/30 text-amber-400" onClick={() => submitApproval(rel._id)}>Submit approval</button>
                <button type="button" className="text-xs px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-400" onClick={() => approve(rel._id)}>Approve</button>
                <button type="button" className="text-xs px-3 py-2 rounded-lg border border-primary/30 text-primary" onClick={() => markReleased(rel._id)}>Mark released</button>
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="text-textMuted text-sm">No releases yet.</p>}
      </div>
    </div>
  )
}
