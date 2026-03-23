import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiEye, FiEyeOff } from 'react-icons/fi'

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
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    setError(''); setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden font-sans">
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl relative z-10 fade-in shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Create Account</h1>
            <p className="text-xs text-textMuted font-medium uppercase tracking-widest">Join IntelliSCM</p>
          </div>

          {error && <div className="bg-red-950/50 border border-error/50 text-error px-4 py-3 rounded-md mb-6 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Full Name</label>
                <input type="text" 
                  className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm"
                  placeholder="JOHN DOE"
                  value={form.name} onChange={set('name')} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Username</label>
                <input type="text" 
                  className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm"
                  placeholder="JOHNDOE99"
                  value={form.username} onChange={set('username')} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Address</label>
              <input type="email" 
                className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm"
                placeholder="EMAIL@DOMAIN.COM"
                value={form.email} onChange={set('email')} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} 
                    className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm pr-12"
                    placeholder="••••••••"
                    value={form.password} onChange={set('password')} required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Confirm</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} 
                    className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm pr-12"
                    placeholder="••••••••"
                    value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none">
                    {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Role</label>
              <select 
                className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white px-4 py-3 rounded-md outline-none text-sm appearance-none"
                value={form.role} onChange={set('role')}>
                {['Developer', 'Project Manager', 'CCB Member', 'Auditor', 'Admin'].map(r => (
                  <option key={r} value={r} className="bg-[#0a0a0a]">{r}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white font-bold uppercase tracking-widest py-3.5 rounded-md mt-4 transition-colors text-sm" disabled={loading}>
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-8 text-xs text-textMuted uppercase tracking-wider font-medium">
            Already have an account? <Link to="/login" className="text-primary hover:text-white transition-colors ml-1 border-b border-primary pb-0.5">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
