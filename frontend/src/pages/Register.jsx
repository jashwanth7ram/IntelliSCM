import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { FaCube } from 'react-icons/fa'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', role: 'Developer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return setError('Security keys do not match.')
    setError(''); setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration sequence failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] px-4 py-12 relative overflow-hidden font-sans w-full">
      {/* Abstract background elements */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none z-0 transform translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.1] rounded-3xl relative z-10 fade-in shadow-2xl">
        <div className="p-8 sm:p-14">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Establish Identity</h1>
            <p className="text-sm text-textMuted font-medium">Provision a new organizational role</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-3 rounded-xl mb-6 text-sm font-semibold flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted">Complete Name</label>
                <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white placeholder-zinc-700 px-5 py-4 rounded-xl outline-none text-sm shadow-inner"
                  placeholder="Real Name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted">System Handle</label>
                <input type="text" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white placeholder-zinc-700 px-5 py-4 rounded-xl outline-none text-sm shadow-inner"
                  placeholder="username_99" value={form.username} onChange={set('username')} required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-textMuted">Email Profile</label>
              <input type="email" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white placeholder-zinc-700 px-5 py-4 rounded-xl outline-none text-sm shadow-inner"
                placeholder="identity@domain.com" value={form.email} onChange={set('email')} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted">Secret Key</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white placeholder-zinc-700 px-5 py-4 rounded-xl outline-none text-sm pr-12 shadow-inner"
                    placeholder="••••••••" value={form.password} onChange={set('password')} required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-textMuted">Verify Key</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.02] transition-colors text-white placeholder-zinc-700 px-5 py-4 rounded-xl outline-none text-sm pr-12 shadow-inner"
                    placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none">
                    {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-textMuted">Authorization Role</label>
              <select className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-5 py-4 rounded-xl outline-none text-sm appearance-none shadow-inner"
                value={form.role} onChange={set('role')}>
                {['Developer', 'Project Manager', 'CCB Member', 'Auditor', 'Admin'].map(r => (
                  <option key={r} value={r} className="bg-zinc-900">{r}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-4 rounded-xl mt-4 transition-all text-sm shadow-[0_0_20px_rgba(168,127,243,0.3)]" disabled={loading}>
                {loading ? 'Transmitting Data...' : 'Initialize Identity'}
              </button>
            </div>
          </form>

          <div className="text-center mt-8 text-sm text-textMuted">
            Already verified? <Link to="/login" className="text-primary hover:text-white transition-colors font-semibold ml-1">Access Protocol</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
