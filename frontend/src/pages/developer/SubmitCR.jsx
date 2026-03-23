import { useState } from 'react'
import { crsAPI } from '../../services/api'
import { FaPaperPlane } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

export default function SubmitCR() {
  const [form, setForm] = useState({ title: '', description: '', changeType: 'Feature', priority: 'Medium', repositoryUrl: '', branchName: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg(''); setErrorMsg('')
    try {
      await crsAPI.create(form)
      setMsg('Change request successfully submitted for AI analysis.')
      setTimeout(() => navigate('/developer'), 2000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit CR.')
      setLoading(false)
    }
  }

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
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

        {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>{msg}</div>}
        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-400"></span>{errorMsg}</div>}

        <form onSubmit={submit} className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted">Title</label>
            <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white px-5 py-4 rounded-xl outline-none text-base placeholder-zinc-600 shadow-inner" 
              placeholder="e.g. Implement OAuth2 Login Provider" value={form.title} onChange={set('title')} required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-textMuted">Description</label>
            <textarea className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white px-5 py-4 rounded-xl outline-none text-base min-h-[160px] placeholder-zinc-600 shadow-inner leading-relaxed resize-y" 
              placeholder="Provide context and technical details about the proposed changes..." value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Type</label>
              <select className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-base appearance-none shadow-inner" 
                value={form.changeType} onChange={set('changeType')}>
                {['Feature', 'Bug Fix', 'Refactor', 'Security', 'Performance', 'Infrastructure'].map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Priority</label>
              <select className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-base appearance-none shadow-inner" 
                value={form.priority} onChange={set('priority')}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Repository URL</label>
              <input type="url" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-base placeholder-zinc-600 shadow-inner" 
                placeholder="https://github.com/org/repo" value={form.repositoryUrl} onChange={set('repositoryUrl')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-textMuted">Branch</label>
              <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-base placeholder-zinc-600 shadow-inner" 
                placeholder="feature/new-login" value={form.branchName} onChange={set('branchName')} />
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.05] mt-2">
            <button type="submit" className="bg-primary hover:bg-primaryHover text-white font-semibold py-4 px-8 rounded-xl transition-all text-base flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(168,127,243,0.4)]" disabled={loading}>
              {loading ? 'Processing...' : <><FaPaperPlane /> Submit Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
