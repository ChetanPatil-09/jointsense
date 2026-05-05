import { mosColor, mosLabel, fmt } from '../../utils/mos'

const Badge = ({ status }) => {
  const colors = { PASS: ['#22c55e22', '#22c55e'], WARN: ['#f59e0b22', '#f59e0b'], FAIL: ['#ef444422', '#ef4444'] }
  const [bg, fg] = colors[status] || colors.PASS
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', background: bg, color: fg }}>{status}</span>
}

const FM_Row = ({ fm, critical }) => (
  <tr style={{ background: critical ? '#ef444408' : 'transparent', borderBottom: '1px solid #1e2028' }}>
    <td style={{ padding: '9px 12px', fontSize: 12, color: '#e8eaf0' }}>
      {fm.name}
      {critical && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', fontFamily: '"JetBrains Mono"' }}>[CRITICAL]</span>}
    </td>
    <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#9aa0b4' }}>{fmt(fm.applied_mpa)}</td>
    <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#9aa0b4' }}>{fmt(fm.allowable_mpa)}</td>
    <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: mosColor(fm.margin_of_safety), fontWeight: 600 }}>{fmt(fm.margin_of_safety, 3)}</td>
    <td style={{ padding: '9px 12px' }}><Badge status={fm.status} /></td>
  </tr>
)

const Table = ({ rows, criticalName }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr style={{ borderBottom: '1px solid #2a2d38' }}>
        {['Failure Mode', 'Applied (MPa)', 'Allowable (MPa)', 'MoS', 'Status'].map(h => (
          <th key={h} style={{ textAlign: 'left', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', padding: '7px 12px' }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>{rows.map(fm => <FM_Row key={fm.name} fm={fm} critical={fm.name === criticalName} />)}</tbody>
  </table>
)

const Card = ({ title, children }) => (
  <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16, marginBottom: 14 }}>
    <h3 style={{ fontSize: 12, fontWeight: 600, color: '#9aa0b4', marginBottom: 14, letterSpacing: .3 }}>{title}</h3>
    {children}
  </div>
)

export default function DetailsTab({ result: r }) {
  const boltFMs = [r.bolt.shear, r.bolt.tension, r.bolt.interaction]
  const critName = r.critical_item.label

  return (
    <div>
      <Card title={`Bolt Analysis — ${r.bolt.material_name} | d=${fmt(r.bolt.diameter, 2)}mm`}>
        <Table rows={boltFMs} criticalName={critName} />
      </Card>
      {r.plates.map(p => (
        <Card key={p.plate_index} title={`Plate ${p.plate_index} — ${p.material_name} | t=${fmt(p.thickness, 2)}mm | w=${fmt(p.width, 2)}mm`}>
          <Table rows={[p.bearing, p.net_section, p.shear_out, p.pull_through]} criticalName={critName} />
        </Card>
      ))}
    </div>
  )
}
