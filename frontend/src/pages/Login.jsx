import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Cpu } from 'lucide-react'

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
    <div className="auth-page">
      <div className="glass auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon"><Cpu size={28} /></div>
          <h1>IntelliSCM</h1>
          <p>AI-Powered Configuration Management</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" className="form-control"
              placeholder="you@company.com"
              value={form.email} onChange={set('email')} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'} className="form-control"
                placeholder="••••••••"
                value={form.password} onChange={set('password')} required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  )
}
