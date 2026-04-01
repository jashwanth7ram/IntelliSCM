import { useState, useEffect, useRef } from 'react'
import { reportsAPI, projectsAPI } from '../../services/api'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FaFileAlt, FaPrint, FaFilter, FaSync, FaShieldAlt,
  FaCodeBranch, FaLayerGroup, FaCheckCircle, FaTimesCircle,
  FaClock, FaChartPie, FaListAlt, FaDownload
} from 'react-icons/fa'

// ── Design tokens ──────────────────────────────────────────────────────
const inputCls  = 'bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-2.5 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner transition-colors'
const selectCls = 'bg-black/40 border border-white/[0.1] focus:border-primary/50 text-white px-4 py-2.5 rounded-xl outline-none text-sm appearance-none shadow-inner transition-colors'

const TOOLTIP_STYLE = {
  backgroundColor: '#0d0d0d',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#e2e8f0',
  fontSize: 12,
  fontWeight: 500,
  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
}

const STATUS_PALETTE = {
  Submitted:            { text: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
  'Under Review':       { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  Approved:             { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  Rejected:             { text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20'     },
  'Needs Modification': { text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20'  },
  'Emergency Fix':      { text: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20'  },
}
const riskColor = r => r === 'High' ? 'text-red-400' : r === 'Medium' ? 'text-amber-400' : 'text-emerald-400'

const STATUS_COLORS   = ['#a87ff3', '#2D68FF', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6']
const RISK_COLORS     = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981', Unscored: '#71717a' }

// ── Helpers ────────────────────────────────────────────────────────────
const fmtDate = (d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString(undefined, opts) : '—'
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// ── Section header ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, color = 'text-primary' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] ${color}`}>
        <Icon size={14} />
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">{label}</h2>
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color = 'text-white', pulse = false }) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] -mr-8 -mt-8 pointer-events-none group-hover:bg-primary/10 transition-all" />
      <div className={`text-3xl font-black tracking-tight mb-1 relative z-10 ${color} ${pulse ? 'animate-pulse' : ''}`}>{value}</div>
      <div className="text-xs font-semibold text-textMuted uppercase tracking-wider relative z-10">{label}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-1 relative z-10">{sub}</div>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────
export default function AuditorReports() {
  const printRef = useRef()

  // filter state
  const [projects,    setProjects]    = useState([])
  const [projectId,   setProjectId]   = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [report,      setReport]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [generated,   setGenerated]   = useState(false)
  const [activeTab,   setActiveTab]   = useState('overview') // 'overview' | 'transactions' | 'baselines' | 'audits'

  useEffect(() => {
    projectsAPI.list().then(r => setProjects(r.data || [])).catch(() => {})
  }, [])

  const generateReport = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setReport(null)
    try {
      const params = {}
      if (projectId) params.projectId = projectId
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      const res = await reportsAPI.routine(params)
      setReport(res.data)
      setGenerated(true)
      setActiveTab('overview')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // ── Derived chart data ────────────────────────────────────────────
  const crStatusChartData = report
    ? Object.entries(report.crStatusSummary || {}).map(([name, value]) => ({ name, value }))
    : []

  const riskChartData = report
    ? Object.entries(report.riskBreakdown || {}).map(([name, value]) => ({ name, value, fill: RISK_COLORS[name] || '#71717a' }))
    : []

  const ciTypeChartData = report
    ? Object.entries(report.ciTypeBreakdown || {}).map(([name, value]) => ({ name, count: value }))
    : []

  const changeTypeChartData = report
    ? Object.entries(report.changeTypeBreakdown || {}).map(([name, value]) => ({ name, count: value }))
    : []

  const s = report?.summary || {}

  const approvalRate = s.totalCRs > 0
    ? Math.round((s.approvedCRs / s.totalCRs) * 100)
    : 0

  const TABS = [
    { id: 'overview',      label: 'Overview',     icon: FaChartPie },
    { id: 'transactions',  label: 'Change Trail',  icon: FaListAlt  },
    { id: 'baselines',     label: 'Baselines',     icon: FaLayerGroup },
    { id: 'audits',        label: 'Audits',        icon: FaShieldAlt },
  ]

  return (
    <div className="fade-in pb-16 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto" ref={printRef}>

      {/* ── Header ── */}
      <div className="mb-10 pt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(168,127,243,0.3)]">
              <FaFileAlt size={16} />
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter">Routine Reports</h1>
          </div>
          <p className="text-lg text-textMuted leading-relaxed ml-1">
            Comprehensive audit-grade reports covering change requests, baselines, CIs, and compliance records.
          </p>
        </div>

        {generated && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm print:hidden shrink-0"
          >
            <FaPrint size={13} />
            Print / Save PDF
          </button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/[0.06] rounded-full blur-[60px] -ml-16 -mt-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <FaFilter size={13} className="text-primary" />
            <h2 className="text-base font-bold text-white tracking-tight">Report Filters</h2>
          </div>
          <form onSubmit={generateReport} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Project</label>
              <select className={selectCls} value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="" className="bg-zinc-900">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id} className="bg-zinc-900">{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Start Date</label>
              <input
                type="date" className={inputCls} style={{ colorScheme: 'dark' }}
                value={startDate} onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">End Date</label>
              <input
                type="date" className={inputCls} style={{ colorScheme: 'dark' }}
                value={endDate} onChange={e => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(168,127,243,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><FaSync size={12} /> Generate Report</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3">
          <FaTimesCircle size={14} /> {error}
        </div>
      )}

      {/* ── Report Content ── */}
      {!generated && !loading && (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-3xl flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
            <FaFileAlt size={24} className="text-white/20" />
          </div>
          <p className="text-base font-semibold text-white/30 mb-2">No Report Generated Yet</p>
          <p className="text-sm text-white/20 max-w-sm leading-relaxed">
            Select filters above and click "Generate Report" to produce a comprehensive audit report.
          </p>
        </div>
      )}

      {report && (
        <div>
          {/* Report Header for Print */}
          <div className="hidden print:block mb-8 border-b border-zinc-300 pb-6">
            <div className="text-2xl font-black text-black">IntelliSCM — Routine Audit Report</div>
            <div className="text-sm text-zinc-600 mt-1">
              Generated: {fmtDateTime(report.generatedAt)}
              {projectId && ` · Project: ${projects.find(p => p._id === projectId)?.name || projectId}`}
              {startDate && endDate && ` · Period: ${fmtDate(startDate)} – ${fmtDate(endDate)}`}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 print:hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_4px_20px_rgba(168,127,243,0.15)]'
                    : 'bg-white/[0.02] border border-white/[0.06] text-textMuted hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
          {(activeTab === 'overview' || true) && (
            <div className={activeTab !== 'overview' ? 'hidden print:block' : ''}>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KPICard label="Total CRs"       value={s.totalCRs    || 0} />
                <KPICard label="Approved CRs"    value={s.approvedCRs || 0} color="text-emerald-400" />
                <KPICard label="Rejected CRs"    value={s.rejectedCRs || 0} color="text-red-400" />
                <KPICard label="Approval Rate"   value={`${approvalRate}%`} color={approvalRate >= 70 ? 'text-emerald-400' : approvalRate >= 40 ? 'text-amber-400' : 'text-red-400'} />
                <KPICard label="Total CIs"       value={s.totalCIs    || 0} color="text-blue-400" />
                <KPICard label="Audits Logged"   value={s.totalAudits || 0} color="text-purple-400" />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
                  <SectionHeader icon={FaChartPie} label="CR Status Breakdown" />
                  {crStatusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={crStatusChartData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} stroke="none">
                          {crStatusChartData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} />
                        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, fontWeight: 600, color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-white/20 py-16 text-center">No data</p>}
                </div>

                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
                  <SectionHeader icon={FaShieldAlt} label="AI Risk Score Distribution" color="text-amber-400" />
                  {riskChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={riskChartData} barSize={44} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="value" name="CRs" radius={[8, 8, 0, 0]}>
                          {riskChartData.map((r, i) => <Cell key={i} fill={r.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-white/20 py-16 text-center">No data</p>}
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
                  <SectionHeader icon={FaCodeBranch} label="Change Type Volume" color="text-blue-400" />
                  {changeTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={changeTypeChartData} barSize={32} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="count" fill="#2D68FF" radius={[8, 8, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-white/20 py-12 text-center">No data</p>}
                </div>

                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
                  <SectionHeader icon={FaLayerGroup} label="CI Type Distribution" color="text-cyan-400" />
                  {ciTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ciTypeChartData} barSize={32} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-white/20 py-12 text-center">No data</p>}
                </div>
              </div>

              {/* CI & Baseline Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaLayerGroup size={11} className="text-blue-400" /> CI Status Summary
                  </div>
                  {Object.keys(report.ciStatusSummary || {}).length === 0 ? (
                    <p className="text-xs text-white/20">No CI data available.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(report.ciStatusSummary || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-sm text-textMuted">{status}</span>
                          <span className="text-sm font-bold text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaCheckCircle size={11} className="text-emerald-400" /> Baseline Summary
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-sm text-textMuted">Total Baselines</span>
                    <span className="text-sm font-bold text-white">{s.totalBaselines || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-sm text-textMuted">Total Audits</span>
                    <span className="text-sm font-bold text-white">{s.totalAudits || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-textMuted">Total CIs</span>
                    <span className="text-sm font-bold text-white">{s.totalCIs || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CHANGE TRAIL TAB ═══════════════════════════════════ */}
          {(activeTab === 'transactions') && (
            <div>
              <SectionHeader icon={FaListAlt} label={`CR Transaction Log (${(report.transactionLog || []).length} transitions)`} />
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden mb-6">
                {(report.transactionLog || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FaListAlt size={24} className="text-white/10 mb-3" />
                    <p className="text-sm text-white/20">No transition history found for this filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-5 py-3">CR Title</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">From Status</th>
                          <th className="px-5 py-3">To Status</th>
                          <th className="px-5 py-3">Changed By</th>
                          <th className="px-5 py-3">Comment</th>
                          <th className="px-5 py-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {(report.transactionLog || []).map((t, i) => {
                          const toPalette = STATUS_PALETTE[t.toStatus] || STATUS_PALETTE['Submitted']
                          return (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 font-semibold text-white max-w-[200px] truncate">{t.crTitle}</td>
                              <td className="px-5 py-3 text-textMuted">{t.project}</td>
                              <td className="px-5 py-3 text-textMuted text-xs">{t.fromStatus}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${toPalette.text} ${toPalette.bg} ${toPalette.border}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {t.toStatus}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-textMuted">{t.changedBy}</td>
                              <td className="px-5 py-3 text-zinc-500 max-w-[180px] truncate text-xs">{t.comment || '—'}</td>
                              <td className="px-5 py-3 text-textMuted text-right text-xs">{fmtDateTime(t.changedAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CRs Detail Table */}
              <div className="flex items-center gap-2 mb-3 mt-8">
                <FaCodeBranch size={13} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Change Requests Detail ({(report.crs || []).length})</h3>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                {(report.crs || []).length === 0 ? (
                  <p className="text-sm text-white/20 py-10 text-center">No CRs found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-5 py-3">Title</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">Submitted By</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Priority</th>
                          <th className="px-5 py-3">Risk</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {(report.crs || []).map(cr => {
                          const sp = STATUS_PALETTE[cr.status] || STATUS_PALETTE['Submitted']
                          return (
                            <tr key={cr._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 font-semibold text-white max-w-[180px] truncate">{cr.title}</td>
                              <td className="px-5 py-3 text-textMuted">{cr.project?.name || '—'}</td>
                              <td className="px-5 py-3 text-textMuted">{cr.submittedBy?.name || '—'}</td>
                              <td className="px-5 py-3 text-zinc-400 text-xs">{cr.changeType || '—'}</td>
                              <td className="px-5 py-3 text-zinc-300 font-medium">{cr.priorityLevel || '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`text-xs font-bold ${riskColor(cr.riskScore)}`}>{cr.riskScore || 'Low'}</span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${sp.text} ${sp.bg} ${sp.border}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {cr.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-textMuted text-right text-xs">{fmtDate(cr.createdAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ BASELINES TAB ══════════════════════════════════════ */}
          {activeTab === 'baselines' && (
            <div>
              <SectionHeader icon={FaLayerGroup} label={`Committed Baselines (${(report.baselines || []).length})`} color="text-primary" />
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                {(report.baselines || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FaLayerGroup size={24} className="text-white/10 mb-3" />
                    <p className="text-sm text-white/20">No baselines committed in this period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-5 py-3">Version Tag</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">Description</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Created By</th>
                          <th className="px-5 py-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.025]">
                        {(report.baselines || []).map(b => (
                          <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono">
                                {b.versionNumber}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-textMuted">{b.project?.name || '—'}</td>
                            <td className="px-5 py-3 text-white max-w-[260px] truncate">{b.description || '—'}</td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                {b.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-textMuted">{b.createdBy?.name || '—'}</td>
                            <td className="px-5 py-3 text-textMuted text-right text-xs">{fmtDate(b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ AUDITS TAB ═════════════════════════════════════════ */}
          {activeTab === 'audits' && (
            <div>
              <SectionHeader icon={FaShieldAlt} label={`Compliance Audits (${(report.audits || []).length})`} color="text-blue-400" />
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                {(report.audits || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FaShieldAlt size={24} className="text-white/10 mb-3" />
                    <p className="text-sm text-white/20">No audits scheduled in this period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-xs font-semibold text-textMuted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">Auditor</th>
                          <th className="px-5 py-3">Audit Date</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Compliance Notes</th>
                          <th className="px-5 py-3 text-right">Logged On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.025]">
                        {(report.audits || []).map(a => (
                          <tr key={a._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                {a.auditType}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-textMuted">{a.project?.name || '—'}</td>
                            <td className="px-5 py-3 text-white font-medium">{a.auditor?.name || '—'}</td>
                            <td className="px-5 py-3 text-white font-semibold">{fmtDate(a.auditDate)}</td>
                            <td className="px-5 py-3 text-textMuted">{a.auditLocation || '—'}</td>
                            <td className="px-5 py-3 text-textMuted max-w-[220px] truncate text-xs">{a.complianceNotes || '—'}</td>
                            <td className="px-5 py-3 text-textMuted text-right text-xs">{fmtDate(a.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Compliance Note */}
              <div className="mt-6 bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 flex items-start gap-3">
                <FaShieldAlt size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">IEEE 828 Compliance Notice</p>
                  <p className="text-xs text-blue-400/70 leading-relaxed">
                    This report contains configuration audit records in accordance with IEEE Std 828™. All records are timestamped, traceability is maintained through the transaction log, and baselines are version-controlled. This document may serve as evidence for FCA/PCA compliance reviews.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Print report footer ── */}
          <div className="hidden print:block mt-10 pt-6 border-t border-zinc-300 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>IntelliSCM Routine Audit Report — Confidential</span>
              <span>Generated {fmtDateTime(report.generatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block  { display: block !important; }
          aside, nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
