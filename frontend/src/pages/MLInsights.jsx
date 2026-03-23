import { useState } from 'react'
import { mlAPI } from '../services/mlApi'
import { FaBrain, FaArrowRight } from 'react-icons/fa'

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
        setError('ML service is offline. Run: cd ml-service && uvicorn main:app --port 8000')
      } else {
        setError(err.response?.data?.detail || 'Prediction failed.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in pb-12 font-sans px-4 sm:px-8 max-w-[1400px] mx-auto">
      <div className="mb-16 pt-8">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
          MACHINE<br/><span className="text-primary">INTELLIGENCE</span>
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Predict defect probability using RandomForest on NASA JM1.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Panel */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 relative z-10">Software Metrics</h2>

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
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                <input type="number" className="w-full bg-[#0a0a0a] border border-[#333] focus:border-primary transition-colors text-white px-4 py-3 rounded-md outline-none text-sm placeholder-zinc-700"
                  value={form[k]} onChange={set(k)} step="any" min={0} />
              </div>
            ))}
          </div>

          <details className="mt-4 group relative z-10 border border-[#333] rounded-lg bg-[#0a0a0a] overflow-hidden">
            <summary className="p-4 cursor-pointer text-zinc-400 font-bold uppercase tracking-widest text-xs flex items-center justify-between hover:text-white transition-colors bg-[#0f0f0f]">
              <span>Halstead Metrics</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#0a0a0a]">
              {[
                { k: 'n', label: 'n (length)' }, { k:'v', label: 'v (volume)' },
                { k: 'l', label: 'l (level)' },  { k:'d', label: 'd (difficulty)' },
                { k: 'i', label: 'i (intelligence)' }, { k:'e', label: 'e (effort)' },
              ].map(({ k, label }) => (
                <div className="flex flex-col gap-2" key={k}>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                  <input type="number" className="w-full bg-[#111] border border-[#333] focus:border-primary transition-colors text-white px-4 py-3 rounded-md outline-none text-sm" 
                    value={form[k]} onChange={set(k)} step="any" min={0} />
                </div>
              ))}
            </div>
          </details>

          <div className="flex flex-col gap-4 mt-10 relative z-10">
            <button className="bg-primary hover:bg-primaryHover text-[#050505] font-black uppercase tracking-widest py-4 rounded-lg transition-all text-sm flex items-center justify-center gap-3 w-full" onClick={predict} disabled={loading}>
              {loading ? 'Analyzing...' : <><FaBrain /> Predict Risk</>}
            </button>
            <button className="bg-transparent border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black uppercase tracking-widest py-4 rounded-lg transition-all text-xs w-full" onClick={() => setForm(DEFAULT_FORM)}>
              Load Sample Values
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-950/50 border border-error/50 text-error px-6 py-4 rounded-lg text-sm font-bold tracking-wide uppercase">{error}</div>
          )}

          {!result && !loading && (
            <div className="bg-[#111] border border-[#222] rounded-xl flex flex-col items-center justify-center text-center p-16 text-zinc-600 h-full min-h-[400px]">
              <FaBrain size={48} className="opacity-20 mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Awaiting Telemetry</h3>
              <p className="text-sm font-medium uppercase tracking-widest mb-8">Run analysis to see results.</p>
            </div>
          )}

          {loading && (
            <div className="bg-[#111] border border-[#222] rounded-xl flex flex-col items-center justify-center text-center p-16 h-full min-h-[400px]">
              <span className="loading loading-ring w-20 text-primary mb-6"></span>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Running ML Pipeline...</p>
            </div>
          )}

          {result && (
            <>
              {/* Main Risk Score */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-10 relative overflow-hidden flex flex-col items-center text-center">
                <div className={`absolute top-0 left-0 w-full h-1 ${result.risk_level === 'High' ? 'bg-primary' : result.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
                
                <h2 className={`text-5xl font-black mb-1 uppercase tracking-tighter ${result.risk_level === 'High' ? 'text-primary' : result.risk_level === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {result.risk_level} RISK
                </h2>
                <div className="text-6xl font-black text-white mb-6">
                  {Math.round(result.defect_probability * 100)}<span className="text-3xl text-zinc-600">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-8">
                  {result.confidence.toFixed(1)}% MODEL CONFIDENCE
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded border ${result.risk_level === 'High' ? 'text-primary border-primary bg-primary/5' : result.risk_level === 'Medium' ? 'text-yellow-500 border-yellow-500 bg-yellow-500/5' : 'text-emerald-500 border-emerald-500 bg-emerald-500/5'}`}>
                    {result.defect_predicted ? 'Defect Probable' : 'Stable Code'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded border border-blue-500/50 text-blue-400 bg-blue-500/5">
                    Impact: {result.impact_level}
                  </span>
                </div>
              </div>

              {/* Feature Contributions */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Key Risk Factors</h3>
                <div className="flex flex-col gap-5">
                  {Object.entries(result.feature_contributions).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                        <span className="text-zinc-400">{k.replace(/_/g, ' ')}</span>
                        <span className="text-white bg-[#222] px-2 py-0.5 rounded">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                      </div>
                      <div className="w-full bg-[#0a0a0a] rounded-full h-1 overflow-hidden border border-[#222]">
                        <div className={`h-full ${result.risk_level === 'High' ? 'bg-primary' : result.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                             style={{ width: `${Math.min((v / 10000) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 text-yellow-500">Action Plan</h3>
                <div className="flex flex-col gap-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="p-5 rounded-lg text-xs font-bold uppercase tracking-wider leading-relaxed border border-[#333] bg-[#0a0a0a] text-zinc-300">
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
