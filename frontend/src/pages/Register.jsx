import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cpu } from 'lucide-react'

const ROLES = ['Developer', 'Project Manager', 'CCB Member', 'Auditor', 'Admin']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', role: 'Developer' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await register(form)
      const routes = {
        Developer: '/developer', 'Project Manager': '/pm',
        'CCB Member': '/ccb', Auditor: '/auditor', Admin: '/admin',
      }
      navigate(routes[user.role] || '/developer')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="glass auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon"><Cpu size={28} /></div>
          <h1>Create Account</h1>
          <p>Join IntelliSCM — AI-Powered SCM</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" placeholder="John Smith"
              value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" placeholder="johndoe123"
              value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control" placeholder="you@company.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')} minLength={6} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-control" placeholder="Confirm your password"
              value={form.confirmPassword} onChange={set('confirmPassword')} minLength={6} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={form.role} onChange={set('role')}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
