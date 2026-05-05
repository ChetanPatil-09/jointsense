import { useState, useEffect } from 'react'
import { getAIAnalysis } from '../../utils/api'
import { mosColor, fmt } from '../../utils/mos'

export default function AITab({ result }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [question, setQuestion] = useState('')

  useEffect(() => { fetchAnalysis() }, [result])

  const fetchAnalysis = async (q = '') => {
    setLoading(true); setError(null); setData(null)
    try {
      const res = await getAIAnalysis({ joint_result: result, user_question: q || null })
      setData(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'AI analysis unavailable. Ensure ANTHROPIC_API_KEY is set in backend .env')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = result.overall_status === 'FAIL' ? '#ef4444' : result.overall_status === 'WARN' ? '#f59e0b' : '#22c55e'
  const statusBg = result.overall_status === 'FAIL' ? '#ef444422' : result.overall_status === 'WARN' ? '#f59e0b22' : '#22c55e22'

  return (
    <div>
      {/* Status banner */}
      <div style={{ background: statusBg, border: `1px solid ${statusColor}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, fontFamily: '"JetBrains Mono"', letterSpacing: 1 }}>
            JOINT {result.overall_status}
          </span>
          <span style={{ fontSize: 12, color: '#9aa0b4', marginLeft: 12 }}>
            Critical: <strong style={{ color: '#e8eaf0' }}>{result.critical_item.label}</strong> → MoS = {' '}
            <span style={{ color: mosColor(result.minimum_mos), fontFamily: '"JetBrains Mono"' }}>
              {fmt(result.minimum_mos, 3)}
            </span>
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>{result.bolt.material_name} bolt | {result.plates.length} plate(s)</div>
      </div>

      {/* AI panel */}
      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ background: '#4f7cff18', border: '1px solid #4f7cff', color: '#4f7cff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: .5 }}>CAE AI</span>
          <span style={{ fontSize: 13, color: '#9aa0b4' }}>Senior Structural Engineer Assessment</span>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', padding: '20px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #2a2d38', borderTopColor: '#4f7cff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Consulting senior CAE engineer AI...</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{ background: '#ef444411', border: '1px solid #ef444444', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#ef4444' }}>
            {error}
          </div>
        )}

        {data && (
          <div>
            {/* Critical mode explanation */}
            <div style={{ background: '#4f7cff0a', borderLeft: '3px solid #4f7cff', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#4f7cff', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CRITICAL MODE ANALYSIS</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#9aa0b4' }}>{data.critical_mode_explanation}</div>
            </div>

            {/* Main analysis */}
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#9aa0b4', marginBottom: 16 }}>{data.analysis}</div>

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Design Recommendations</div>
                {data.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, background: '#181b22', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ color: '#4f7cff', fontFamily: '"JetBrains Mono"', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>0{i + 1}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#9aa0b4' }}>{rec}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow-up question */}
      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Ask the CAE Assistant</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && question.trim() && fetchAnalysis(question)}
            placeholder="e.g. What happens if I increase bolt diameter by 25%?"
            style={{ flex: 1, background: '#181b22', border: '1px solid #2a2d38', color: '#e8eaf0', padding: '8px 12px', borderRadius: 6, fontFamily: 'Syne, sans-serif', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => question.trim() && fetchAnalysis(question)}
            disabled={loading || !question.trim()}
            style={{ padding: '8px 16px', background: '#4f7cff', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', opacity: loading ? .6 : 1 }}
          >
            Ask ↗
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {[
            'How do I reduce weight while maintaining margins?',
            'Which material upgrade has the most impact?',
            'What edge distance do you recommend?',
            'Explain the interaction equation',
          ].map(q => (
            <button key={q} onClick={() => { setQuestion(q); fetchAnalysis(q) }}
              style={{ padding: '4px 10px', background: '#181b22', border: '1px solid #2a2d38', color: '#9aa0b4', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'Syne, sans-serif' }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Material props reference */}
      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Material Properties Reference</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d38' }}>
              {['Component', 'Material', 'Ftu', 'Fsu', 'Fbru'].map(h => (
                <th key={h} style={{ textAlign: 'left', color: '#6b7280', padding: '5px 10px', fontSize: 10, letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1e2028' }}>
              <td style={{ padding: '7px 10px', color: '#4f7cff' }}>Bolt</td>
              <td style={{ padding: '7px 10px', color: '#e8eaf0' }}>{result.bolt.material_name}</td>
              <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#9aa0b4' }}>{fmt(result.bolt.tension.allowable_mpa, 0)} MPa</td>
              <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#9aa0b4' }}>{fmt(result.bolt.shear.allowable_mpa, 0)} MPa</td>
              <td style={{ padding: '7px 10px', color: '#6b7280' }}>—</td>
            </tr>
            {result.plates.map(p => (
              <tr key={p.plate_index} style={{ borderBottom: '1px solid #1e2028' }}>
                <td style={{ padding: '7px 10px', color: '#22c55e' }}>Plate {p.plate_index}</td>
                <td style={{ padding: '7px 10px', color: '#e8eaf0' }}>{p.material_name}</td>
                <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#9aa0b4' }}>{fmt(p.net_section.allowable_mpa, 0)} MPa</td>
                <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#9aa0b4' }}>{fmt(p.shear_out.allowable_mpa, 0)} MPa</td>
                <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#9aa0b4' }}>{fmt(p.bearing.allowable_mpa, 0)} MPa</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
