import axios from 'axios'

// In development: proxy via vite (/api → localhost:8000)
// In production (Railway): use VITE_API_URL env variable
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export const runAnalysis = (payload) => api.post('/analysis/run', payload)
export const getMaterials = () => api.get('/materials/')
export const getAIAnalysis = (payload) => api.post('/ai/analyze', payload)

export default api
