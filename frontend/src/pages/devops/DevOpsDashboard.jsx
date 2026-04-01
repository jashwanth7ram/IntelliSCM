import { useEffect, useState } from 'react'
import { devopsAPI, projectsAPI } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const card = 'bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5'

export default function DevOpsDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    projectsAPI.list().then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setErr('')
    const params = { days: String(days) }
    if (projectId) params.project = projectId
    devopsAPI
      .metrics(params)
      .then(r => setMetrics(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load metrics'))
      .finally(() => setLoading(false))
  }, [projectId, days])

  const chartData = metrics
    ? [
        { name: 'Deploy / wk', value: metrics.deploymentFrequencyPerWeek || 0 },
        { name: 'CFR', value: Math.round((metrics.changeFailureRate || 0) * 100) },
        { name: 'Lead (h)', value: metrics.leadTimeForChangesHours ?? 0 },
        { name: 'Pipe OK%', value: metrics.pipelineSuccessRate != null ? Math.round(metrics.pipelineSuccessRate * 100) : 0 },
      ]
    : []

  if (loading && !metrics) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner text-primary loading-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-textMuted uppercase tracking-wider block mb-2">Project</label>
          <select
            className="bg-black/40 border border-white/[0.1] text-white px-4 py-2.5 rounded-xl text-sm min-w-[200px]"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-textMuted uppercase tracking-wider block mb-2">Period (days)</label>
          <select
            className="bg-black/40 border border-white/[0.1] text-white px-4 py-2.5 rounded-xl text-sm"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          >
            {[7, 14, 30, 60].map(d => (
              <option key={d} value={d} className="bg-zinc-900">{d} days</option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{err}</div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={card}>
              <div className="text-2xl font-black text-white">{metrics.deploymentFrequencyPerWeek ?? '—'}</div>
              <div className="text-xs text-textMuted uppercase tracking-wider mt-1">Deployments / week</div>
            </div>
            <div className={card}>
              <div className="text-2xl font-black text-amber-400">{metrics.changeFailureRate != null ? `${(metrics.changeFailureRate * 100).toFixed(1)}%` : '—'}</div>
              <div className="text-xs text-textMuted uppercase tracking-wider mt-1">Change failure rate</div>
            </div>
            <div className={card}>
              <div className="text-2xl font-black text-emerald-400">{metrics.leadTimeForChangesHours ?? '—'}</div>
              <div className="text-xs text-textMuted uppercase tracking-wider mt-1">Lead time (hours)</div>
            </div>
            <div className={card}>
              <div className="text-2xl font-black text-red-400">{metrics.highRiskCRsOpen ?? 0}</div>
              <div className="text-xs text-textMuted uppercase tracking-wider mt-1">Open high-risk CRs</div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Delivery indicators</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#a87ff3" radius={[8, 8, 0, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-textMuted mt-4">
              CFR shown as percentage points for the chart. Pipeline success uses completed runs in the selected period.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
