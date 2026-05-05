import { useState, useEffect } from 'react'
import PlateRow from './PlateRow'

const DEFAULT_PLATES = [
  { id: 1, width: 25.4, thickness: 3.175, material_key: 'al2024_t3' },
  { id: 2, width: 25.4, thickness: 3.175, material_key: 'al7075_t6' },
]
const BOLT_MATERIALS = ['titanium_6al4v','steel_a286','steel_4340','steel_17_4ph','inconel718','al2024_t4']
const EDGE_OPTS  = [{value:'1.5d',label:'1.5D'},{value:'2d',label:'2.0D'},{value:'custom',label:'Custom'}]
const PRYING_OPTS = [
  {value:'default',label:'Default (0.75×Fx)'},{value:'conservative',label:'Conservative (1.0×Fx)'},
  {value:'optimistic',label:'Optimistic (0.5×Fx)'},{value:'custom',label:'User-defined factor'},
]
let _uid = 10
const uid = () => ++_uid

export default function Sidebar({ materials, onAnalyze, loading, importedConfig, onImportConsumed }) {
  const [boltDiam,     setBoltDiam]     = useState(6.35)
  const [boltMat,      setBoltMat]      = useState('titanium_6al4v')
  const [plates,       setPlates]       = useState(DEFAULT_PLATES)
  const [edgeMode,     setEdgeMode]     = useState('1.5d')
  const [customEdge,   setCustomEdge]   = useState(10)
  const [Fx,           setFx]           = useState(2000)
  const [Fy,           setFy]           = useState(3000)
  const [Fz,           setFz]           = useState(1000)
  const [pryingModel,  setPryingModel]  = useState('default')
  const [pryingFactor, setPryingFactor] = useState(0.75)
  const [flash,        setFlash]        = useState(null)  // {msg, type}

  // ── Apply imported config whenever it changes ─────────────
  useEffect(() => {
    if (!importedConfig) return

    const cfg = importedConfig
    const changed = cfg.detected_fields || []

    // Always apply — even if values are defaults, user clicked Apply intentionally
    if (cfg.bolt_diameter) setBoltDiam(cfg.bolt_diameter)

    if (cfg.plates && cfg.plates.length > 0) {
      setPlates(cfg.plates.map(p => ({
        id: uid(),
        width:        parseFloat(p.width)        || 25.4,
        thickness:    parseFloat(p.thickness)    || 3.175,
        material_key: p.material_key             || 'al2024_t3',
      })))
    }

    if (cfg.edge_distance_mode) setEdgeMode(cfg.edge_distance_mode)
    if (cfg.Fx && cfg.Fx > 0)   setFx(cfg.Fx)
    if (cfg.Fy && cfg.Fy > 0)   setFy(cfg.Fy)
    if (cfg.Fz && cfg.Fz > 0)   setFz(cfg.Fz)

    const msg = changed.length > 0
      ? `✓ Sidebar updated from file — ${changed.join(' | ')}`
      : `✓ Sidebar updated from file (default geometry applied)`

    setFlash({ msg, type: 'success' })
    setTimeout(() => setFlash(null), 5000)

    onImportConsumed()
  }, [importedConfig])

  const addPlate = () => setPlates(p => [...p, {id:uid(), width:25.4, thickness:3.175, material_key:'al2024_t3'}])
  const removePlate = (id) => { if (plates.length > 1) setPlates(p => p.filter(x => x.id !== id)) }
  const updatePlate = (id, field, val) => setPlates(p => p.map(x => x.id===id ? {...x, [field]: val} : x))

  const handleSubmit = () => onAnalyze({
    bolt_diameter:       parseFloat(boltDiam),
    bolt_material_key:   boltMat,
    plates: plates.map(p => ({
      width:        parseFloat(p.width),
      thickness:    parseFloat(p.thickness),
      material_key: p.material_key,
    })),
    Fx: parseFloat(Fx)||0, Fy: parseFloat(Fy)||0, Fz: parseFloat(Fz)||0,
    edge_distance_mode:   edgeMode,
    custom_edge_distance: edgeMode==='custom' ? parseFloat(customEdge) : null,
    prying_model:   pryingModel,
    prying_factor:  pryingModel==='custom' ? parseFloat(pryingFactor) : null,
  })

  const css = {
    wrap:    {background:'#111318',borderRight:'1px solid #2a2d38',display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'},
    hdr:     {padding:'18px 16px',borderBottom:'1px solid #2a2d38',flexShrink:0},
    logoRow: {display:'flex',alignItems:'center',gap:10,marginBottom:2},
    icon:    {width:30,height:30,background:'#4f7cff',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'},
    logoTxt: {fontSize:15,fontWeight:700,color:'#e8eaf0',letterSpacing:.5},
    sub:     {fontSize:10,color:'#6b7280',letterSpacing:1.5,textTransform:'uppercase',marginLeft:40},
    scroll:  {flex:1,overflowY:'auto',paddingBottom:88},
    sec:     {padding:'14px 16px',borderBottom:'1px solid #2a2d38'},
    stitle:  {fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#6b7280',marginBottom:10,fontWeight:600},
    field:   {marginBottom:10},
    lbl:     {display:'block',fontSize:11,color:'#9aa0b4',marginBottom:3},
    inp:     {width:'100%',background:'#181b22',border:'1px solid #2a2d38',color:'#e8eaf0',padding:'6px 9px',borderRadius:6,fontFamily:'"JetBrains Mono",monospace',fontSize:12,outline:'none'},
    sel:     {width:'100%',background:'#181b22',border:'1px solid #2a2d38',color:'#e8eaf0',padding:'6px 9px',borderRadius:6,fontSize:12,outline:'none',fontFamily:'Syne,sans-serif'},
    row2:    {display:'grid',gridTemplateColumns:'1fr 1fr',gap:8},
    edgeRow: {display:'flex',gap:6},
    eBtn:    (a) => ({flex:1,padding:'6px 0',borderRadius:6,border:`1px solid ${a?'#4f7cff':'#2a2d38'}`,
                      background:a?'#4f7cff18':'#181b22',color:a?'#4f7cff':'#9aa0b4',
                      cursor:'pointer',fontSize:11,textAlign:'center',fontFamily:'Syne,sans-serif',fontWeight:600}),
    addBtn:  {width:'100%',marginTop:6,padding:'7px 0',background:'#181b22',border:'1px solid #2a2d38',
              color:'#9aa0b4',borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:'Syne,sans-serif',fontWeight:600},
    footer:  {position:'absolute',bottom:0,left:0,width:320,padding:'14px 16px',background:'#111318',borderTop:'1px solid #2a2d38'},
    runBtn:  {width:'100%',padding:'10px 0',background:loading?'#3d63d4':'#4f7cff',color:'#fff',
              border:'none',borderRadius:8,cursor:loading?'not-allowed':'pointer',
              fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'},
    flash:   {margin:'10px 16px 0',padding:'8px 12px',borderRadius:6,fontSize:11,
              fontFamily:'"JetBrains Mono",monospace',lineHeight:1.5,
              background:'#22c55e18',border:'1px solid #22c55e55',color:'#22c55e'},
  }

  return (
    <aside style={css.wrap}>
      {/* Header */}
      <div style={css.hdr}>
        <div style={css.logoRow}>
          <div style={css.icon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5">
              <circle cx="8" cy="8" r="2.5"/>
              <line x1="8" y1="1" x2="8" y2="4.5"/><line x1="8" y1="11.5" x2="8" y2="15"/>
              <line x1="1" y1="8" x2="4.5" y2="8"/><line x1="11.5" y1="8" x2="15" y2="8"/>
            </svg>
          </div>
          <span style={css.logoTxt}>JointSense</span>
        </div>
        <div style={css.sub}>Structural Joint Analysis · CAE</div>
      </div>

      <div style={css.scroll}>
        {/* Flash message */}
        {flash && <div style={css.flash}>{flash.msg}</div>}

        {/* BOLT */}
        <div style={css.sec}>
          <div style={css.stitle}>Bolt Configuration</div>
          <div style={css.field}>
            <label style={css.lbl}>Diameter (mm)</label>
            <input style={css.inp} type="number" value={boltDiam} min="1" max="100" step="0.1"
              onChange={e=>setBoltDiam(e.target.value)}/>
          </div>
          <div style={css.field}>
            <label style={css.lbl}>Bolt Material</label>
            <select style={css.sel} value={boltMat} onChange={e=>setBoltMat(e.target.value)}>
              {BOLT_MATERIALS.map(k=><option key={k} value={k}>{materials[k]?.name||k}</option>)}
            </select>
          </div>
        </div>

        {/* PLATES */}
        <div style={css.sec}>
          <div style={css.stitle}>Plates ({plates.length})</div>
          {plates.map((p,i)=>(
            <PlateRow key={p.id} index={i+1} plate={p} materials={materials}
              onChange={(f,v)=>updatePlate(p.id,f,v)}
              onRemove={()=>removePlate(p.id)} canRemove={plates.length>1}/>
          ))}
          <button style={css.addBtn} onClick={addPlate}>+ Add Plate</button>
        </div>

        {/* EDGE DISTANCE */}
        <div style={css.sec}>
          <div style={css.stitle}>Edge Distance</div>
          <div style={{...css.field,marginBottom:0}}>
            <div style={css.edgeRow}>
              {EDGE_OPTS.map(o=>(
                <button key={o.value} style={css.eBtn(edgeMode===o.value)}
                  onClick={()=>setEdgeMode(o.value)}>{o.label}</button>
              ))}
            </div>
          </div>
          {edgeMode==='custom'&&(
            <div style={{...css.field,marginTop:8,marginBottom:0}}>
              <label style={css.lbl}>Custom Edge Distance (mm)</label>
              <input style={css.inp} type="number" value={customEdge} min="1" step="0.5"
                onChange={e=>setCustomEdge(e.target.value)}/>
            </div>
          )}
        </div>

        {/* LOADS */}
        <div style={css.sec}>
          <div style={css.stitle}>Applied Loads</div>
          <div style={css.field}>
            <label style={css.lbl}>Axial Load Fx (N)</label>
            <input style={css.inp} type="number" value={Fx} step="100" onChange={e=>setFx(e.target.value)}/>
          </div>
          <div style={{...css.row2,...css.field}}>
            <div>
              <label style={css.lbl}>Shear Fy (N)</label>
              <input style={css.inp} type="number" value={Fy} step="100" onChange={e=>setFy(e.target.value)}/>
            </div>
            <div>
              <label style={css.lbl}>Shear Fz (N)</label>
              <input style={css.inp} type="number" value={Fz} step="100" onChange={e=>setFz(e.target.value)}/>
            </div>
          </div>
          <div style={css.field}>
            <label style={css.lbl}>Prying Model</label>
            <select style={css.sel} value={pryingModel} onChange={e=>setPryingModel(e.target.value)}>
              {PRYING_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {pryingModel==='custom'&&(
            <div style={{...css.field,marginBottom:0}}>
              <label style={css.lbl}>Prying Factor</label>
              <input style={css.inp} type="number" value={pryingFactor} min="0" max="5" step="0.05"
                onChange={e=>setPryingFactor(e.target.value)}/>
            </div>
          )}
        </div>
      </div>

      <div style={css.footer}>
        <button style={css.runBtn} onClick={handleSubmit} disabled={loading}>
          {loading?'Analyzing...':'Run Analysis ↗'}
        </button>
      </div>
    </aside>
  )
}
