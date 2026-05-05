import { Bar } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { mosColor, fmt } from '../../utils/mos'

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 14 }}>
    <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: color || '#e8eaf0' }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{sub}</div>
  </div>
)

export default function DashboardTab({ result: r }) {
  const labels = r.all_margins.map(m => m.label)
  const values = r.all_margins.map(m => parseFloat(m.margin_of_safety.toFixed(3)))
  const colors = values.map(v => mosColor(v))

  const mosData = {
    labels,
    datasets: [{
      label: 'MoS',
      data: values,
      backgroundColor: colors.map(c => c + '44'),
      borderColor: colors,
      borderWidth: 1.5,
      borderRadius: 3,
    }]
  }

  const boltLabels = ['Shear', 'Tension', 'Interaction']
  const applied = [r.bolt.shear.applied_mpa / r.bolt.shear.allowable_mpa, r.bolt.tension.applied_mpa / r.bolt.tension.allowable_mpa, r.bolt.interaction.applied_mpa]
  const ratioData = {
    labels: boltLabels,
    datasets: [
      { label: 'Load Ratio', data: applied.map(v => parseFloat(v.toFixed(3))), backgroundColor: '#4f7cff44', borderColor: '#4f7cff', borderWidth: 1.5, borderRadius: 3 },
      { label: 'Limit', data: [1, 1, 1], backgroundColor: '#ef444422', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 3 },
    ]
  }

  const chartOpts = (horizontal = false) => ({
    responsive: true, maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e2028' }, ticks: { color: '#9aa0b4', font: { family: 'JetBrains Mono', size: 10 } } },
      y: { grid: { color: '#1e2028' }, ticks: { color: '#9aa0b4', font: { family: 'JetBrains Mono', size: 10 } } },
    }
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Min Margin of Safety" value={fmt(r.minimum_mos, 3)}
          sub={`${r.overall_status} — ${r.critical_item.label}`}
          color={mosColor(r.minimum_mos)} />
        <KPI label="Bolt Shear MoS" value={fmt(r.bolt.shear.margin_of_safety, 3)}
          sub={`${fmt(r.bolt.shear.applied_mpa)} / ${fmt(r.bolt.shear.allowable_mpa)} MPa`}
          color={mosColor(r.bolt.shear.margin_of_safety)} />
        <KPI label="Interaction MoS" value={fmt(r.bolt.interaction.margin_of_safety, 3)}
          sub={`Rs²+Rt² = ${fmt(r.bolt.interaction_value, 3)}`}
          color={mosColor(r.bolt.interaction.margin_of_safety)} />
        <KPI label="Grip Length" value={fmt(r.grip_length, 2)}
          sub={`mm — ${r.plates.length} plate(s), e=${fmt(r.edge_distance, 2)}mm`}
          color="#e8eaf0" />
      </div>

      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#9aa0b4', letterSpacing: .5, marginBottom: 14, fontWeight: 600 }}>Margin of Safety — All Failure Modes</div>
        <div style={{ position: 'relative', height: Math.max(200, r.all_margins.length * 36) }}>
          <Bar data={mosData} options={chartOpts(true)} />
        </div>
      </div>

      <div style={{ background: '#111318', border: '1px solid #2a2d38', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#9aa0b4', letterSpacing: .5, marginBottom: 14, fontWeight: 600 }}>Bolt Load Ratio vs Allowable</div>
        <div style={{ position: 'relative', height: 220 }}>
          <Bar data={ratioData} options={chartOpts(false)} />
        </div>
      </div>
    </div>
  )
}
