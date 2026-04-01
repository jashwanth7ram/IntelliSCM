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
  list:            ()           => api.get('/crs'),
  listByProject:   (projectId)  => api.get(`/crs?project=${projectId}`),
  getById:         (id)         => api.get(`/crs/${id}`),
  create:          (data)       => api.post('/crs', data),
  updateStatus:    (id, data)   => api.patch(`/crs/${id}/status`, data),
  addComment:      (id, data)   => api.post(`/crs/${id}/comments`, data),
  updateLabels:    (id, data)   => api.put(`/crs/${id}/labels`, data),
  changeCalendar:  (params)     => api.get('/crs/change-calendar', { params }),
  statusReport:    (projectId)  => api.get(`/crs/status-report${projectId ? `?project=${projectId}` : ''}`),
  addCommit:       (id, data)   => api.post(`/crs/${id}/commits`, data),
  setRepoTree:     (id, data)   => api.patch(`/crs/${id}/repo-tree`, data),
}

// ─── CCB ────────────────────────────────────────────
export const ccbAPI = {
  decide: (data) => api.post('/ccb/decide', data),
}

// ─── Baselines ──────────────────────────────────────
export const baselinesAPI = {
  list:   ()     => api.get('/baselines'),
  create: (data) => api.post('/baselines', data),
}

// ─── Audits ─────────────────────────────────────────
export const auditsAPI = {
  list:   ()     => api.get('/audits'),
  create: (data) => api.post('/audits', data),
}

// ─── Notifications ───────────────────────────────────
export const notificationsAPI = {
  list:   ()   => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
}


// ─── Reports ────────────────────────────────────────
export const reportsAPI = {
  changeActivity: ()       => api.get('/reports?reportType=change_activity'),
  routine:        (params) => api.get('/reports/routine', { params }),
}

export const activityAPI = {
  /** @param {Record<string, string>} [params] — e.g. { project: projectId } */
  list: (params) => api.get('/activity', { params }),
}

// ─── DevOps (pipelines, releases, deployments, metrics) ─────────────
export const devopsAPI = {
  metrics: (params) => api.get('/devops/metrics', { params }),
  trace:   (crId)    => api.get(`/devops/trace/${crId}`),
}

export const pipelinesAPI = {
  listDefinitions: (params) => api.get('/pipelines/definitions', { params }),
  createDefinition: (data)   => api.post('/pipelines/definitions', data),
  listRuns:        (params)   => api.get('/pipelines/runs', { params }),
  getRun:          (id)       => api.get(`/pipelines/runs/${id}`),
  startRun:        (data)     => api.post('/pipelines/runs/start', data),
  advanceRun:      (id, data) => api.post(`/pipelines/runs/${id}/advance`, data),
  simulateSuccess: (id)      => api.post(`/pipelines/runs/${id}/simulate-success`),
}

export const releasesAPI = {
  list:            (params)   => api.get('/releases', { params }),
  create:          (data)     => api.post('/releases', data),
  getById:         (id)       => api.get(`/releases/${id}`),
  updateCRs:       (id, changeRequestIds) => api.patch(`/releases/${id}/crs`, { changeRequestIds }),
  generateNotes:   (id)       => api.post(`/releases/${id}/release-notes`),
  submitApproval:  (id)       => api.post(`/releases/${id}/submit-approval`),
  approve:         (id)       => api.post(`/releases/${id}/approve`),
  markReleased:    (id)       => api.post(`/releases/${id}/mark-released`),
}

export const deploymentsAPI = {
  list:       (params) => api.get('/deployments', { params }),
  create:     (data)   => api.post('/deployments', data),
  updateStatus: (id, data) => api.patch(`/deployments/${id}/status`, data),
  envSummary: (params) => api.get('/deployments/summary/env', { params }),
}

// ─── CI Registry (IEEE 828 §5.2) ────────────────────
export const cisAPI = {
  list:          (params)       => api.get('/cis', { params }),
  listByProject: (projectId)    => api.get('/cis', { params: { project: projectId } }),
  getById:       (id)           => api.get(`/cis/${id}`),
  create:        (data)         => api.post('/cis', data),
  update:        (id, data)     => api.patch(`/cis/${id}`, data),
  bumpVersion:   (id, data)     => api.post(`/cis/${id}/version-bump`, data),
  archive:       (id)           => api.delete(`/cis/${id}`),
  stats:         (projectId)    => api.get(`/cis/stats/${projectId}`),
}

export default api
