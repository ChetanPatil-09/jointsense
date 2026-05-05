const PLATE_MATERIALS = [
  'al2024_t3', 'al7075_t6', 'al6061_t6', 'al2024_t4',
  'titanium_6al4v', 'titanium_3al2_5v', 'steel_a286',
  'steel_4340', 'steel_17_4ph', 'inconel718', 'inconel625'
]

const s = {
  wrap: { background: '#181b22', border: '1px solid #2a2d38', borderRadius: 8, padding: 10, marginBottom: 6, position: 'relative' },
  label: { fontSize: 10, color: '#4f7cff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, marginBottom: 6 },
  removeBtn: { position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 },
  fl: { display: 'block', fontSize: 11, color: '#9aa0b4', marginBottom: 3 },
  inp: { width: '100%', background: '#0a0c10', border: '1px solid #2a2d38', color: '#e8eaf0', padding: '5px 8px', borderRadius: 5, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, outline: 'none' },
  sel: { width: '100%', background: '#0a0c10', border: '1px solid #2a2d38', color: '#e8eaf0', padding: '5px 8px', borderRadius: 5, fontSize: 11, outline: 'none', fontFamily: 'Syne, sans-serif' },
}

export default function PlateRow({ index, plate, materials, onChange, onRemove, canRemove }) {
  return (
    <div style={s.wrap}>
      <div style={s.label}>Plate {index}</div>
      {canRemove && <button style={s.removeBtn} onClick={onRemove} title="Remove plate">✕</button>}
      <div style={s.row2}>
        <div>
          <label style={s.fl}>Width (mm)</label>
          <input style={s.inp} type="number" value={plate.width} min="1" step="0.5"
            onChange={e => onChange('width', parseFloat(e.target.value))} />
        </div>
        <div>
          <label style={s.fl}>Thickness (mm)</label>
          <input style={s.inp} type="number" value={plate.thickness} min="0.1" step="0.1"
            onChange={e => onChange('thickness', parseFloat(e.target.value))} />
        </div>
      </div>
      <div>
        <label style={s.fl}>Material</label>
        <select style={s.sel} value={plate.material_key} onChange={e => onChange('material_key', e.target.value)}>
          {PLATE_MATERIALS.map(k => (
            <option key={k} value={k}>{materials[k]?.name || k}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
