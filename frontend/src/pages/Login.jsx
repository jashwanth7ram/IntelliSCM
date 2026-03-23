import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow]     = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const routes = {
        Developer: '/developer',
        'Project Manager': '/pm',
        'CCB Member': '/ccb',
        Auditor: '/auditor',
        Admin: '/admin',
      }
      navigate(routes[user.role] || '/developer')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl relative z-10 fade-in shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Login</h1>
            <p className="text-xs text-textMuted font-medium uppercase tracking-widest">IntelliSCM Access</p>
          </div>

          {error && <div className="bg-red-950/50 border border-error/50 text-error px-4 py-3 rounded-md mb-6 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Address</label>
              <input
                type="email" 
                className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm"
                placeholder="EMAIL@DOMAIN.COM"
                value={form.email} onChange={set('email')} required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} 
                  className="w-full bg-[#0a0a0a] border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-zinc-700 px-4 py-3 rounded-md outline-none text-sm pr-12"
                  placeholder="••••••••"
                  value={form.password} onChange={set('password')} required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                >
                  {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white font-bold uppercase tracking-widest py-3.5 rounded-md mt-4 transition-colors text-sm" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-8 text-xs text-textMuted uppercase tracking-wider font-medium">
            Don't have an account? <Link to="/register" className="text-primary hover:text-white transition-colors ml-1 border-b border-primary pb-0.5">Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
