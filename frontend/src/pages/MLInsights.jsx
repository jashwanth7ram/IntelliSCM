import { useState } from 'react'
import { mlAPI } from '../services/mlApi'
import { FaBrain, FaWandMagicSparkles } from 'react-icons/fa6'

const DEFAULT_FORM = {
  loc: 190, v_g: 3, ev_g: 1, iv_g: 3,
  n: 600, v: 4348.76, l: 0.06, d: 17, i: 254.87,
  e: 74202, b: 1.45, t: 4122,
  lOCode: 129, lOComment: 29, lOBlank: 28, locCodeAndComment: 2,
  uniq_Op: 17, uniq_Opnd: 135, total_Op: 329, total_Opnd: 271, branchCount: 5,
}

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
        setError('ML Model Server is unreachable. Please verify connection.')
      } else {
        setError(err.response?.data?.detail || 'Prediction failed. Invalid metrics.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <FaBrain /> AI Risk Guardian
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
          Machine Intelligence
        </h1>
        <p className="text-lg text-textMuted max-w-2xl leading-relaxed">
          Predict software defect probability using a RandomForest model trained on NASA JM1 telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Input Panel */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-2xl">
          <h2 className="text-xl font-bold text-white tracking-tight mb-8 relative z-10 border-b border-white/[0.05] pb-4">Software Metrics</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 relative z-10">
            {[
              { k: 'loc',     label: 'Lines of Code (LOC)' },
              { k: 'v_g',     label: 'Cyclomatic Comp v(g)' },
              { k: 'ev_g',    label: 'Essential Comp ev(g)' },
              { k: 'iv_g',    label: 'Design Comp iv(g)' },
              { k: 'branchCount', label: 'Branch Count' },
              { k: 'lOCode',  label: 'Lines of Code' },
              { k: 'uniq_Op', label: 'Unique Operators' },
              { k: 'uniq_Opnd',label:'Unique Operands' },
              { k: 'total_Op', label: 'Total Operators' },
              { k: 'total_Opnd',label:'Total Operands' },
            ].map(({ k, label }) => (
              <div className="flex flex-col gap-2" key={k}>
                <label className="text-xs font-semibold text-textMuted">{label}</label>
                <input type="number" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm placeholder-zinc-700 shadow-inner"
                  value={form[k]} onChange={set(k)} step="any" min={0} />
              </div>
            ))}
          </div>

          <details className="group relative z-10 border border-white/[0.05] rounded-2xl bg-white/[0.01] overflow-hidden mb-8">
            <summary className="p-5 cursor-pointer text-textMuted font-semibold text-sm flex items-center justify-between hover:text-white hover:bg-white/[0.02] transition-colors">
              <span>Extended Halstead Telemetry</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/20 border-t border-white/[0.05]">
              {[
                { k: 'n', label: 'Length (n)' }, { k:'v', label: 'Volume (v)' },
                { k: 'l', label: 'Level (l)' },  { k:'d', label: 'Difficulty (d)' },
                { k: 'i', label: 'Intelligence (i)' }, { k:'e', label: 'Effort (e)' },
              ].map(({ k, label }) => (
                <div className="flex flex-col gap-2" key={k}>
                  <label className="text-xs font-semibold text-textMuted">{label}</label>
                  <input type="number" className="w-full bg-black/40 border border-white/[0.1] focus:border-primary/50 transition-colors text-white px-4 py-3 rounded-xl outline-none text-sm shadow-inner" 
                    value={form[k]} onChange={set(k)} step="any" min={0} />
                </div>
              ))}
            </div>
          </details>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-6 border-t border-white/[0.05]">
            <button className="bg-primary hover:bg-primaryHover text-white font-bold py-4 px-8 rounded-xl transition-all text-sm flex items-center justify-center gap-3 flex-1 shadow-[0_0_20px_rgba(168,127,243,0.3)]" onClick={predict} disabled={loading}>
              {loading ? 'Analyzing Neural Network...' : <><FaBrain /> Predict Defect Risk</>}
            </button>
            <button className="bg-white/[0.03] border border-white/[0.1] hover:bg-white/[0.08] text-white font-semibold py-4 px-8 rounded-xl transition-all text-sm flex items-center justify-center gap-2" onClick={() => setForm(DEFAULT_FORM)}>
              <FaWandMagicSparkles /> Load Sample
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>{error}</div>
          )}

          {!result && !loading && (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center text-center p-16 text-textMuted h-full min-h-[500px]">
              <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
                <FaBrain size={32} className="opacity-40" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">Awaiting Telemetry</h3>
              <p className="text-sm font-medium">Input metrics and run analysis to render predictions.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center text-center p-16 h-full min-h-[500px]">
              <span className="loading loading-ring w-20 text-primary mb-6"></span>
              <p className="text-sm font-semibold text-textMuted animate-pulse">Running ML Pipeline...</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6">
              {/* Main Risk Score */}
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-10 relative overflow-hidden flex flex-col items-center text-center">
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${result.risk_level === 'High' ? 'bg-red-500/20' : result.risk_level === 'Medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}></div>
                
                <h2 className="text-sm font-bold text-textMuted mb-4 uppercase tracking-widest">Assessment Result</h2>
                <div className="text-7xl font-black text-white tracking-tighter mb-4">
                  {Math.round(result.defect_probability * 100)}<span className="text-3xl text-zinc-500 font-medium">%</span>
                </div>
                
                <div className="flex items-center gap-3 mb-8">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${result.risk_level === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/30' : result.risk_level === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'}`}>
                    {result.risk_level} Risk
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/[0.05] border border-white/[0.1] text-white">
                    {result.confidence.toFixed(1)}% Confidence
                  </span>
                </div>
                
                <p className="text-lg text-white font-medium">
                  {result.defect_predicted ? 'Defect probability is alarmingly high.' : 'Code architecture appears stable.'}
                </p>
              </div>

              {/* Feature Contributions */}
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                <h3 className="text-lg font-bold text-white tracking-tight mb-6">Key Risk Factors</h3>
                <div className="flex flex-col gap-5">
                  {Object.entries(result.feature_contributions).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-textMuted capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-white bg-white/[0.05] border border-white/[0.1] px-2.5 py-1 rounded-lg text-xs">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${result.risk_level === 'High' ? 'bg-red-400' : result.risk_level === 'Medium' ? 'bg-amber-400' : 'bg-primary'}`} 
                             style={{ width: `${Math.min((v / 10000) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                  <h3 className="text-lg font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                    <FaWandMagicSparkles className="text-primary" /> Action Plan
                  </h3>
                  <div className="flex flex-col gap-3">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">{i+1}</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
