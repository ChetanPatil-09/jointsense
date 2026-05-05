export const mosStatus = (v) => v < 0 ? 'fail' : v < 0.2 ? 'warn' : 'pass'
export const mosColor = (v) => v < 0 ? '#ef4444' : v < 0.2 ? '#f59e0b' : '#22c55e'
export const mosLabel = (v) => v < 0 ? 'FAIL' : v < 0.2 ? 'WARN' : 'PASS'
export const fmt = (v, d = 1) => typeof v === 'number' ? v.toFixed(d) : v
