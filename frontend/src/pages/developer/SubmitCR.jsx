import { useState } from 'react'
import { crsAPI } from '../../services/api'
import { FaPaperPlane, FaArrowRight } from 'react-icons/fa'
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
      setMsg('Change Request successfully submitted for AI Risk Analysis.')
      setTimeout(() => navigate('/developer'), 2000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit CR.')
      setLoading(false)
    }
  }

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1000px] mx-auto">
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          SUBMIT<br/><span className="text-primary">REQUEST</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Propose code changes to the SCM pipeline.</p>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        {msg && <div className="bg-primary/20 border border-primary text-white px-6 py-4 rounded-lg mb-8 text-sm font-bold tracking-wide uppercase">{msg}</div>}
        {errorMsg && <div className="bg-red-950/50 border border-error/50 text-error px-6 py-4 rounded-lg mb-8 text-sm font-bold tracking-wide uppercase">{errorMsg}</div>}

        <form onSubmit={submit} className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CR Title</label>
            <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
              placeholder="E.G. IMPLEMENT OAUTH2 LOGIN" value={form.title} onChange={set('title')} required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
            <textarea className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm min-h-[160px] placeholder-zinc-700 leading-relaxed" 
              placeholder="DETAILED EXPLANATION OF THE PROPOSED CHANGES..." value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Change Type</label>
              <select className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm appearance-none" 
                value={form.changeType} onChange={set('changeType')}>
                {['Feature', 'Bug Fix', 'Refactor', 'Security', 'Performance', 'Infrastructure'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Priority</label>
              <select className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm appearance-none" 
                value={form.priority} onChange={set('priority')}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Repository URL</label>
              <input type="url" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                placeholder="HTTPS://GITHUB.COM/ORG/REPO" value={form.repositoryUrl} onChange={set('repositoryUrl')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Branch Name</label>
              <input type="text" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-5 py-4 rounded-lg outline-none text-sm placeholder-zinc-700" 
                placeholder="FEATURE/NEW-LOGIN" value={form.branchName} onChange={set('branchName')} />
            </div>
          </div>

          <button type="submit" className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest py-5 rounded-lg mt-6 transition-all text-sm flex items-center justify-center gap-3 w-full sm:w-auto sm:px-12 self-start" disabled={loading}>
            {loading ? 'Processing...' : <><FaPaperPlane /> Submit Request</>}
          </button>
        </form>
      </div>
    </div>
  )
}
