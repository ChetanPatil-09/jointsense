export default function TabBar({ tabs, active, onChange, disabled, alwaysEnabled = [] }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #2a2d38', background: '#111318', flexShrink: 0 }}>
      {tabs.map(t => {
        const isAlways = alwaysEnabled.includes(t.id)
        const isDisabled = disabled && !isAlways
        const isActive = active === t.id
        const isUpload = t.id === 'upload'
        return (
          <button
            key={t.id}
            onClick={() => !isDisabled && onChange(t.id)}
            style={{
              padding: '13px 20px',
              fontSize: 12,
              fontWeight: 600,
              color: isActive ? '#4f7cff' : isDisabled ? '#3a3d4a' : isUpload ? '#f59e0b' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${isActive ? (isUpload ? '#f59e0b' : '#4f7cff') : 'transparent'}`,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: .3,
              transition: 'color .15s',
              marginLeft: isUpload ? 'auto' : 0,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
