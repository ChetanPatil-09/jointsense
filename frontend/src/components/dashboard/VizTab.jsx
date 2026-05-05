import { Bar } from 'react-chartjs-2'
import { mosColor, fmt } from '../../utils/mos'

const MAT_COLORS = {
  al2024_t3: '#4f7cff', al7075_t6: '#22c55e', al6061_t6: '#86efac',
  titanium_6al4v: '#a78bfa', steel_a286: '#f59e0b', steel_4340: '#f97316',
  steel_17_4ph: '#fb923c', inconel718: '#ec4899', inconel625: '#f9a8d4',
  al2024_t4: '#06b6d4', titanium_3al2_5v: '#c4b5fd',
}

export default function VizTab({ result: r, formState, materials }) {
  const plates = formState?.plates || []
  const d = r.bolt_diameter

  // Build schematic SVG
  let py = 30
  const plateElems = []
  plates.forEach((p, i) => {
    const ph = Math.max(24, p.thickness * 5)
    const mat = materials[p.material_key] || {}
    const col = MAT_COLORS[p.material_key] || '#4f7cff'
    const matName = mat.name ? mat.name.split(' ')[0] : p.material_key
    plateElems.push({ py, ph, col, matName, thickness: p.thickness, index: i + 1 })
    py += ph + 3
  })
  const totalH = py
  const svgH = totalH + 60
  const cx = 200

  const boltCol = MAT_COLORS[formState?.bolt_material_key] || '#a78bfa'

  // Bar chart data — plate bearing stress
  const plateBearingData = {
    labels: r.plates.map(p => `P${p.plate_index} ${p.material_name.split(' ')[0]}`),
    datasets: [
      { label: 'Applied', data: r.plates.map(p => parseFloat(p.bearing.applied_mpa.toFixed(1))), backgroundColor: '#4f7cff44', borderColor: '#4f7cff', borderWidth: 1.5, borderRadius: 3 },
      { label: 'Allowable', data: r.plates.map(p => parseFloat(p.bearing.allowable_mpa.toFixed(1))), backgroundColor: '#22c55e33', borderColor: '#22c55e', borderWidth: 1.5, borderRadius: 3 },
    ]
  }

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e2028' }, ticks: { color: '#9aa0b4', font: { family: 'JetBrains Mono', size: 10 } } },
      y: { grid: { color: '#1e2028' }, ticks: { color: '#9aa0b4', font: { family: 'JetBrains Mono', size: 10 } } },
    }
  }

  return (
    <div>
      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#9aa0b4', letterSpacing: .5, marginBottom: 14, fontWeight: 600 }}>
          Joint Schematic — {plates.length}-Plate Configuration
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="420" height={svgH} viewBox={`0 0 420 ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {/* Load arrows */}
            <defs>
              <marker id="arrowB" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0L6,3L0,6Z" fill="#4f7cff" />
              </marker>
              <marker id="arrowY" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0L6,3L0,6Z" fill="#f59e0b" />
              </marker>
            </defs>

            {plateElems.map(el => (
              <g key={el.index}>
                <rect x={cx - 90} y={el.py} width="180" height={el.ph}
                  fill={el.col + '22'} stroke={el.col} strokeWidth="1.5" rx="2" />
                <text x={cx - 80} y={el.py + el.ph / 2 + 4} fill={el.col} fontSize="10">
                  P{el.index}: {el.matName}
                </text>
                <text x={cx + 80} y={el.py + el.ph / 2 + 4} fill="#6b7280" fontSize="9" textAnchor="end">
                  t={fmt(el.thickness, 2)}mm
                </text>
              </g>
            ))}

            {/* Bolt */}
            <line x1={cx} y1="10" x2={cx} y2={totalH + 20}
              stroke={boltCol} strokeWidth="5" strokeLinecap="round" />
            <circle cx={cx} cy="12" r="11" fill={boltCol} opacity=".9" />
            <text x={cx} y="16" fill="#fff" fontSize="8" textAnchor="middle">●</text>
            <circle cx={cx} cy={totalH + 18} r="9" fill={boltCol} opacity=".7" />

            {/* Shear arrow */}
            <line x1={cx - 130} y1={30 + (totalH - 30) / 2}
              x2={cx - 96} y2={30 + (totalH - 30) / 2}
              stroke="#4f7cff" strokeWidth="1.5" markerEnd="url(#arrowB)" />
            <text x={cx - 135} y={30 + (totalH - 30) / 2 + 4}
              fill="#4f7cff" fontSize="9" textAnchor="end">
              Fy={fmt(r.resultant_shear, 0)}N
            </text>

            {/* Axial arrow */}
            <line x1={cx + 96} y1="16" x2={cx + 130} y2="16"
              stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrowY)" />
            <text x={cx + 134} y="20" fill="#f59e0b" fontSize="9">
              Fx={fmt(r.Fx, 0)}N
            </text>

            {/* Info bar */}
            <text x={cx} y={svgH - 8} fill="#4b5563" fontSize="9" textAnchor="middle">
              d={fmt(d, 2)}mm | e={fmt(r.edge_distance, 2)}mm | grip={fmt(r.grip_length, 2)}mm | {r.n_shear_planes} shear plane(s)
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e2028' }}>
          {plates.map((p, i) => {
            const col = MAT_COLORS[p.material_key] || '#4f7cff'
            const matName = materials[p.material_key]?.name || p.material_key
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9aa0b4' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: col + '44', border: `1px solid ${col}` }} />
                P{i + 1}: {matName}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#9aa0b4', letterSpacing: .5, marginBottom: 14, fontWeight: 600 }}>Plate Bearing: Applied vs Allowable</div>
        <div style={{ position: 'relative', height: 220 }}>
          <Bar data={plateBearingData} options={chartOpts} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#9aa0b4' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4f7cff44', border: '1px solid #4f7cff', display: 'inline-block' }} />Applied
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e33', border: '1px solid #22c55e', display: 'inline-block' }} />Allowable
          </span>
        </div>
      </div>

      {/* Summary table */}
      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#9aa0b4', letterSpacing: .5, marginBottom: 14, fontWeight: 600 }}>All Margins Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d38' }}>
              {['Mode', 'Component', 'MoS', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', color: '#6b7280', padding: '6px 10px', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.all_margins.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e2028' }}>
                <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: '#e8eaf0' }}>{m.label}</td>
                <td style={{ padding: '7px 10px', color: '#6b7280' }}>{m.component}</td>
                <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono"', color: mosColor(m.margin_of_safety), fontWeight: 600 }}>{fmt(m.margin_of_safety, 3)}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    fontFamily: '"JetBrains Mono"',
                    background: m.status === 'PASS' ? '#22c55e22' : m.status === 'WARN' ? '#f59e0b22' : '#ef444422',
                    color: m.status === 'PASS' ? '#22c55e' : m.status === 'WARN' ? '#f59e0b' : '#ef4444'
                  }}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
