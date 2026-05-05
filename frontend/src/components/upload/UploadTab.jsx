import { useState, useRef } from 'react'
import axios from 'axios'

const card  = { background:'#111318', border:'1px solid #2a2d38', borderRadius:10, padding:20, marginBottom:16 }
const stitle = { fontSize:11, color:'#6b7280', letterSpacing:1, textTransform:'uppercase', marginBottom:14, fontWeight:600 }

const Badge = ({ text, color='#4f7cff' }) => (
  <span style={{ background:color+'22', border:`1px solid ${color}44`, color,
    fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:700,
    fontFamily:'"JetBrains Mono"', marginRight:6, marginBottom:4, display:'inline-block' }}>{text}</span>
)

const Section = ({ title, icon, children }) => (
  <div style={card}>
    <div style={stitle}>{icon} {title}</div>
    {children}
  </div>
)

const PropRow = ({ label, value, mono }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #1e2028' }}>
    <span style={{ fontSize:12, color:'#6b7280' }}>{label}</span>
    <span style={{ fontSize:12, color:'#e8eaf0', fontFamily: mono?'"JetBrains Mono",monospace':'inherit', textAlign:'right' }}>{value}</span>
  </div>
)

export default function UploadTab({ onApplyConfig }) {
  const [dragging, setDragging] = useState(false)
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)
  const [applied,  setApplied]  = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.py')) { setError('Only Python (.py) files are supported.'); return }
    setFile(f); setError(null); setResult(null); setApplied(false)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post('/api/upload/upload-calc', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed. Is the backend running?')
    } finally { setLoading(false) }
  }

  const handleApply = () => {
    if (!result?.suggested_config || !onApplyConfig) return
    onApplyConfig(result.suggested_config)
    setApplied(true)
  }

  const r = result
  const a = r?.analysis

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
        onClick={()=>inputRef.current.click()}
        style={{
          border:`2px dashed ${dragging?'#4f7cff':file?'#22c55e':'#2a2d38'}`,
          borderRadius:12, padding:'40px 20px', textAlign:'center', cursor:'pointer',
          background:dragging?'#4f7cff08':file?'#22c55e08':'#111318',
          marginBottom:16, transition:'all .2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".py" style={{display:'none'}}
          onChange={e=>handleFile(e.target.files[0])}/>
        <div style={{fontSize:36,marginBottom:12}}>{file?'✅':'🐍'}</div>
        {file ? (
          <>
            <div style={{fontSize:14,fontWeight:700,color:'#22c55e',marginBottom:4}}>{file.name}</div>
            <div style={{fontSize:12,color:'#6b7280'}}>{(file.size/1024).toFixed(1)} KB — click to change</div>
          </>
        ) : (
          <>
            <div style={{fontSize:14,fontWeight:600,color:'#9aa0b4',marginBottom:6}}>Drop your Python file here</div>
            <div style={{fontSize:12,color:'#6b7280'}}>or click to browse — <span style={{color:'#4f7cff',fontFamily:'"JetBrains Mono"'}}>.py</span> files only</div>
          </>
        )}
      </div>

      {error && (
        <div style={{background:'#ef444411',border:'1px solid #ef444444',borderRadius:8,
          padding:'10px 14px',fontSize:13,color:'#ef4444',marginBottom:16}}>{error}</div>
      )}

      {file && !result && (
        <button onClick={handleUpload} disabled={loading} style={{
          width:'100%',padding:'12px 0',background:loading?'#3d63d4':'#4f7cff',
          color:'#fff',border:'none',borderRadius:8,cursor:loading?'not-allowed':'pointer',
          fontSize:14,fontWeight:700,fontFamily:'Syne,sans-serif',marginBottom:16,
          display:'flex',alignItems:'center',justifyContent:'center',gap:10,
        }}>
          {loading ? (
            <>
              <div style={{width:16,height:16,border:'2px solid #ffffff44',borderTopColor:'#fff',
                borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
              Parsing file...
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </>
          ) : '🔍 Analyze & Integrate'}
        </button>
      )}

      {r && (
        <>
          {/* Status banner */}
          <div style={{
            background:a.compatible?'#22c55e11':'#f59e0b11',
            border:`1px solid ${a.compatible?'#22c55e44':'#f59e0b44'}`,
            borderRadius:10,padding:'14px 18px',marginBottom:12,
          }}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,fontFamily:'"JetBrains Mono"',
              color:a.compatible?'#22c55e':'#f59e0b',marginBottom:6}}>
              {a.compatible?'✓ COMPATIBLE WITH JOINTSENSE':'⚠ MANUAL REVIEW NEEDED'}
              {a.ai_enriched && <span style={{color:'#4f7cff',marginLeft:10}}>✦ AI ENRICHED</span>}
            </div>
            <div style={{fontSize:13,color:'#9aa0b4',lineHeight:1.7}}>{a.summary}</div>
          </div>

          {/* ── APPLY TO SIDEBAR BUTTON ── */}
          <button onClick={handleApply} style={{
            width:'100%', padding:'14px 0', marginBottom:16,
            background: applied
              ? 'linear-gradient(135deg,#16a34a,#15803d)'
              : 'linear-gradient(135deg,#22c55e,#16a34a)',
            color:'#fff', border:'none', borderRadius:10,
            cursor:'pointer', fontSize:15, fontWeight:700,
            fontFamily:'Syne,sans-serif',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow: applied ? 'none' : '0 0 24px #22c55e44',
            transition:'all .3s',
          }}>
            {applied ? '✓ Applied to Sidebar!' : '⬅  Apply to Sidebar & Pre-fill Inputs'}
          </button>

          {/* What was detected */}
          {r.suggested_config?.detected_fields?.length > 0 && (
            <div style={{background:'#22c55e08',border:'1px solid #22c55e22',borderRadius:8,
              padding:'10px 14px',marginBottom:16,fontSize:12,color:'#22c55e',
              fontFamily:'"JetBrains Mono"'}}>
              📌 Detected from file: {r.suggested_config.detected_fields.join(' | ')}
            </div>
          )}

          {/* File Structure */}
          <Section title="Parsed File Structure" icon="📂">
            <PropRow label="Classes"   value={r.parsed.class_count}    mono/>
            <PropRow label="Methods"   value={r.parsed.function_count} mono/>
            <PropRow label="Formulas"  value={r.parsed.formula_count}  mono/>
            <PropRow label="Imports"   value={r.parsed.imports.join(', ')||'none'}/>
            {r.parsed.constants.length>0 && (
              <PropRow label="Constants"
                value={r.parsed.constants.map(c=>`${c.name}=${c.value}`).join(' | ')} mono/>
            )}
          </Section>

          {/* Classes & Methods */}
          {r.parsed.classes.length>0 && (
            <Section title="Classes & Methods" icon="🏗">
              {r.parsed.classes.map((cls,i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#4f7cff',
                    fontFamily:'"JetBrains Mono"',marginBottom:4}}>
                    class {cls.name}
                    {cls.init_args.length>0 && (
                      <span style={{color:'#6b7280',fontWeight:400}}>({cls.init_args.join(', ')})</span>
                    )}
                  </div>
                  {cls.docstring && (
                    <div style={{fontSize:11,color:'#6b7280',marginBottom:8,fontStyle:'italic'}}>{cls.docstring}</div>
                  )}
                  {cls.methods.filter(m=>!m.is_init).map((m,j)=>(
                    <div key={j} style={{background:'#181b22',border:'1px solid #2a2d38',
                      borderRadius:6,padding:'8px 12px',marginBottom:6}}>
                      <div style={{fontSize:12,color:'#22c55e',fontFamily:'"JetBrains Mono"',marginBottom:2}}>
                        def {m.name}({m.args.join(', ')})
                        {m.returns && <span style={{color:'#6b7280'}}> → {m.returns}</span>}
                      </div>
                      {m.docstring && <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{m.docstring}</div>}
                      {m.formulas.length>0 && m.formulas.map((f,k)=>(
                        <div key={k} style={{background:'#0a0c10',borderRadius:4,padding:'4px 8px',
                          fontFamily:'"JetBrains Mono"',fontSize:11,color:'#a78bfa',marginBottom:2}}>
                          return {f}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </Section>
          )}

          {/* Formulas */}
          {r.parsed.formulas.length>0 && (
            <Section title="Formulas Extracted" icon="📐">
              {r.parsed.formulas.map((f,i)=>(
                <div key={i} style={{background:'#181b22',borderRadius:8,padding:'10px 14px',marginBottom:8}}>
                  <div style={{fontSize:11,color:'#4f7cff',fontWeight:700,
                    fontFamily:'"JetBrains Mono"',marginBottom:6}}>{f.context}</div>
                  <div style={{fontFamily:'"JetBrains Mono"',fontSize:12,color:'#e8eaf0',
                    background:'#0a0c10',padding:'6px 10px',borderRadius:6}}>
                    {f.expression}
                  </div>
                  {f.args?.length>0 && (
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>Args: {f.args.join(', ')}</div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Inputs */}
          {a.inputs_detected.length>0 && (
            <Section title="Inputs Detected" icon="⚙️">
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {a.inputs_detected.map((inp,i)=>(
                  <div key={i} style={{background:'#181b22',border:'1px solid #2a2d38',
                    borderRadius:8,padding:'8px 12px',flex:'1 1 180px'}}>
                    <div style={{fontSize:12,color:'#4f7cff',fontFamily:'"JetBrains Mono"',fontWeight:600}}>{inp.name}</div>
                    <div style={{fontSize:11,color:'#9aa0b4',marginTop:2}}>{inp.description}</div>
                    <div style={{fontSize:10,color:'#6b7280',marginTop:2}}>Unit: {inp.unit}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Failure Modes */}
          {a.failure_modes.length>0 && (
            <Section title="Failure Modes Detected" icon="⚠️">
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:a.new_failure_modes.length>0?12:0}}>
                {a.failure_modes.map((m,i)=>(
                  <Badge key={i} text={m} color={a.new_failure_modes.includes(m)?'#f59e0b':'#22c55e'}/>
                ))}
              </div>
              {a.new_failure_modes.length>0 && (
                <div style={{background:'#f59e0b11',border:'1px solid #f59e0b33',
                  borderRadius:8,padding:'8px 12px',marginTop:8}}>
                  <div style={{fontSize:11,color:'#f59e0b',fontWeight:700,marginBottom:6}}>
                    🆕 New — not yet in JointSense:
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {a.new_failure_modes.map((m,i)=><Badge key={i} text={m} color="#f59e0b"/>)}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Engineering notes */}
          {a.engineering_notes && (
            <Section title="Engineering Insight (AI)" icon="🧠">
              <div style={{fontSize:13,color:'#9aa0b4',lineHeight:1.8}}>{a.engineering_notes}</div>
            </Section>
          )}

          {/* Integration steps */}
          {a.integration_suggestions.length>0 && (
            <Section title="How to Integrate into JointSense" icon="🔧">
              {a.integration_suggestions.map((step,i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:10,
                  background:'#181b22',borderRadius:8,padding:'10px 14px'}}>
                  <div style={{color:'#4f7cff',fontFamily:'"JetBrains Mono"',
                    fontSize:13,fontWeight:700,flexShrink:0}}>0{i+1}</div>
                  <div style={{fontSize:13,color:'#9aa0b4',lineHeight:1.6}}>{step}</div>
                </div>
              ))}
              <div style={{background:'#4f7cff11',border:'1px solid #4f7cff33',
                borderRadius:8,padding:'10px 14px',marginTop:8}}>
                <div style={{fontSize:11,color:'#4f7cff',fontWeight:700,marginBottom:4}}>📁 Target file</div>
                <div style={{fontSize:12,color:'#e8eaf0',fontFamily:'"JetBrains Mono"'}}>
                  backend/app/services/plate_analysis.py
                </div>
              </div>
            </Section>
          )}

          {/* Compatibility */}
          <Section title="Compatibility Notes" icon="📋">
            <div style={{fontSize:13,color:'#9aa0b4',lineHeight:1.7}}>{a.compatibility_notes}</div>
          </Section>

          <button onClick={()=>{setFile(null);setResult(null);setError(null);setApplied(false)}}
            style={{width:'100%',padding:'10px 0',background:'#181b22',border:'1px solid #2a2d38',
              color:'#9aa0b4',borderRadius:8,cursor:'pointer',fontSize:13,
              fontFamily:'Syne,sans-serif',fontWeight:600}}>
            Upload Another File
          </button>
        </>
      )}
    </div>
  )
}
