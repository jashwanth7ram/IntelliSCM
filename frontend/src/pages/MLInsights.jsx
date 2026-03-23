import { useState } from 'react'
import { mlAPI } from '../services/mlApi'
import { Cpu, Zap, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

const DEFAULT_FORM = {
  loc: 190, v_g: 3, ev_g: 1, iv_g: 3,
  n: 600, v: 4348.76, l: 0.06, d: 17, i: 254.87,
  e: 74202, b: 1.45, t: 4122,
  lOCode: 129, lOComment: 29, lOBlank: 28, locCodeAndComment: 2,
  uniq_Op: 17, uniq_Opnd: 135, total_Op: 329, total_Opnd: 271, branchCount: 5,
}

const RISK_COLOR = { Low: 'var(--emerald)', Medium: 'var(--yellow)', High: 'var(--red)' }
const IMPACT_COLOR = { Minor: 'var(--emerald)', Moderate: 'var(--blue)', Major: 'var(--yellow)', Critical: 'var(--red)' }

export default function MLInsights() {
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))

  const predict = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await mlAPI.predict(form)
      setResult(res.data)
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('ML service is offline. Run: cd ml-service && uvicorn main:app --port 8000')
      } else {
        setError(err.response?.data?.detail || 'Prediction failed.')
      }
    } finally { setLoading(false) }
  }

  const riskColor = result ? RISK_COLOR[result.risk_level] : 'var(--emerald)'

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">🤖 ML Risk Insights</h1>
        <p className="page-subtitle">Predict defect probability and risk level for any software module using our RandomForest model trained on NASA JM1 data</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Input Panel */}
        <div className="glass" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={17} /> Software Module Metrics
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { k: 'loc',     label: 'Lines of Code (LOC)',       min: 1 },
              { k: 'v_g',     label: 'Cyclomatic Complexity v(g)', min: 1 },
              { k: 'ev_g',    label: 'Essential Complexity ev(g)', min: 1 },
              { k: 'iv_g',    label: 'Design Complexity iv(g)',    min: 1 },
              { k: 'branchCount', label: 'Branch Count',          min: 0 },
              { k: 'lOCode',  label: 'Lines of Code',             min: 0 },
              { k: 'uniq_Op', label: 'Unique Operators',          min: 0 },
              { k: 'uniq_Opnd',label:'Unique Operands',           min: 0 },
              { k: 'total_Op', label: 'Total Operators',          min: 0 },
              { k: 'total_Opnd',label:'Total Operands',           min: 0 },
            ].map(({ k, label, min }) => (
              <div className="form-group" key={k}>
                <label className="form-label" style={{ fontSize: 11 }}>{label}</label>
                <input type="number" className="form-control"
                  value={form[k]} onChange={set(k)} min={min} step="any"
                  style={{ fontSize: 13 }} />
              </div>
            ))}
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
              ▸ Halstead Metrics (optional)
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              {[
                { k: 'n', label: 'n (length)' }, { k:'v', label: 'v (volume)' },
                { k: 'l', label: 'l (level)' },  { k:'d', label: 'd (difficulty)' },
                { k: 'i', label: 'i (intelligence)' }, { k:'e', label: 'e (effort)' },
              ].map(({ k, label }) => (
                <div className="form-group" key={k}>
                  <label className="form-label" style={{ fontSize: 11 }}>{label}</label>
                  <input type="number" className="form-control" value={form[k]} onChange={set(k)} step="any" style={{ fontSize: 13 }} />
                </div>
              ))}
            </div>
          </details>

          <button className="btn btn-primary" onClick={predict} disabled={loading}
            style={{ marginTop: 20, width: '100%', justifyContent: 'center', padding: '13px' }}>
            {loading ? <><span className="pulse">⚙️</span> Analyzing…</> : <><Cpu size={16} /> Predict Risk</>}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => setForm(DEFAULT_FORM)}
            style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            Reset to Sample Values
          </button>
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {!result && !loading && (
            <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p>Enter module metrics and click <strong style={{ color: 'var(--emerald)' }}>Predict Risk</strong> to analyze</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Model trained on 10,885 NASA JM1 software modules</p>
            </div>
          )}

          {loading && (
            <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 48, height: 48, marginBottom: 16 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Running ML inference…</p>
            </div>
          )}

          {result && (
            <>
              {/* Main Risk Score */}
              <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
                <div className="risk-circle" style={{ borderColor: riskColor, boxShadow: `0 0 25px ${riskColor}44` }}>
                  <div className="pct" style={{ color: riskColor }}>
                    {Math.round(result.defect_probability * 100)}%
                  </div>
                  <div className="pct-label">Defect Risk</div>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: riskColor, marginBottom: 6 }}>
                  {result.risk_level} Risk
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {result.confidence.toFixed(1)}% model confidence
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${result.risk_level.toLowerCase()}`}>
                    Risk: {result.risk_level}
                  </span>
                  <span className="badge" style={{
                    background: `${IMPACT_COLOR[result.impact_level]}22`,
                    color: IMPACT_COLOR[result.impact_level],
                    border: `1px solid ${IMPACT_COLOR[result.impact_level]}44`
                  }}>
                    Impact: {result.impact_level}
                  </span>
                  <span className={`badge badge-${result.defect_predicted ? 'rejected' : 'approved'}`}>
                    {result.defect_predicted ? '⚠️ Defect Likely' : '✅ Low Defect Risk'}
                  </span>
                </div>
              </div>

              {/* Feature Contributions */}
              <div className="glass" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                  <TrendingUp size={15} style={{ display: 'inline', marginRight: 6 }} />
                  Key Metrics
                </h3>
                {Object.entries(result.feature_contributions).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {k.replace(/_/g, ' ')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: '60%', justifyContent: 'flex-end' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill"
                          style={{ width: `${Math.min((v / 10000) * 100, 100)}%`, background: riskColor }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 50, textAlign: 'right' }}>
                        {typeof v === 'number' ? v.toFixed(1) : v}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="glass" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                  <Zap size={15} style={{ display: 'inline', marginRight: 6 }} />
                  Recommendations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)',
                      borderLeft: `3px solid ${riskColor}`,
                    }}>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
