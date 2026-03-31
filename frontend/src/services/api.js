import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_BASE })

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth & Users ───────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile:  ()     => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
}

export const usersAPI = {
  list: () => api.get('/auth/users'),
}

// ─── Projects ───────────────────────────────────────
export const projectsAPI = {
  list:   ()     => api.get('/projects'),
  create: (data) => api.post('/projects', data),
}

// ─── Change Requests ────────────────────────────────
export const crsAPI = {
  list:         ()         => api.get('/crs'),
  create:       (data)     => api.post('/crs', data),
  updateStatus: (id, data) => api.patch(`/crs/${id}/status`, data),
  statusReport: (projectId) => api.get(`/crs/status-report${projectId ? `?project=${projectId}` : ''}`),
}

// ─── CCB ────────────────────────────────────────────
export const ccbAPI = {
  decide: (data) => api.post('/ccb/decide', data),
}

// ─── Baselines ──────────────────────────────────────
export const baselinesAPI = {
  create: (data) => api.post('/baselines', data),
}

// ─── Audits ─────────────────────────────────────────
export const auditsAPI = {
  create: (data) => api.post('/audits', data),
}

// ─── Reports ────────────────────────────────────────
export const reportsAPI = {
  changeActivity: () => api.get('/reports?reportType=change_activity'),
}

// ─── CI Registry (IEEE 828 §5.2) ────────────────────
export const cisAPI = {
  list:        (params)       => api.get('/cis', { params }),
  getById:     (id)           => api.get(`/cis/${id}`),
  create:      (data)         => api.post('/cis', data),
  update:      (id, data)     => api.patch(`/cis/${id}`, data),
  bumpVersion: (id, data)     => api.post(`/cis/${id}/version-bump`, data),
  archive:     (id)           => api.delete(`/cis/${id}`),
  stats:       (projectId)    => api.get(`/cis/stats/${projectId}`),
}

export default api
