export default function EmptyState({ loading, error }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #2a2d38', borderTopColor: '#4f7cff', borderRadius: '50%', animation: 'spin .7s linear infinite', marginBottom: 16 }} />
      <div style={{ fontSize: 14 }}>Running structural analysis...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Analysis Error</div>
      <div style={{ fontSize: 13, color: '#9aa0b4', maxWidth: 340, lineHeight: 1.6 }}>{error}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: 40, color: '#6b7280' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: .3 }}>⬡</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#9aa0b4', marginBottom: 8 }}>No Analysis Run Yet</div>
      <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 300 }}>
        Configure joint parameters in the sidebar and click <strong style={{ color: '#4f7cff' }}>Run Analysis</strong> to get started.
      </div>
    </div>
  )
}
