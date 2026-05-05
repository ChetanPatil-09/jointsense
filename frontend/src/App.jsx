import { useState, useEffect } from 'react'
import Sidebar from './components/sidebar/Sidebar'
import TabBar from './components/shared/TabBar'
import DashboardTab from './components/dashboard/DashboardTab'
import DetailsTab from './components/dashboard/DetailsTab'
import VizTab from './components/dashboard/VizTab'
import AITab from './components/ai/AITab'
import UploadTab from './components/upload/UploadTab'
import EmptyState from './components/shared/EmptyState'
import { runAnalysis, getMaterials } from './utils/api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'details',   label: 'Failure Modes' },
  { id: 'viz',       label: 'Visualization' },
  { id: 'ai',        label: 'CAE Assistant' },
  { id: 'upload',    label: '⬆ Upload Calc' },
]

export default function App() {
  const [activeTab,    setActiveTab]    = useState('dashboard')
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [materials,    setMaterials]    = useState({})
  const [formState,    setFormState]    = useState(null)
  // ← This is the key: a config object pushed from UploadTab into Sidebar
  const [importedConfig, setImportedConfig] = useState(null)

  useEffect(() => {
    getMaterials().then(r => setMaterials(r.data)).catch(() => {})
  }, [])

  const handleAnalyze = async (payload) => {
    setLoading(true)
    setError(null)
    setFormState(payload)
    try {
      const { data } = await runAnalysis(payload)
      setResult(data)
      setActiveTab('dashboard')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  // Called by UploadTab when user clicks "Apply to Sidebar"
  const handleApplyConfig = (config) => {
    setImportedConfig(config)
    setActiveTab('dashboard')   // switch away from upload tab so sidebar is visible
  }

  const renderTab = () => {
    if (activeTab === 'upload') return (
      <UploadTab onApplyConfig={handleApplyConfig} />
    )
    if (!result) return <EmptyState loading={loading} error={error} />
    switch (activeTab) {
      case 'dashboard': return <DashboardTab result={result} />
      case 'details':   return <DetailsTab result={result} />
      case 'viz':       return <VizTab result={result} formState={formState} materials={materials} />
      case 'ai':        return <AITab result={result} />
      default:          return null
    }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', height:'100vh', background:'#0a0c10' }}>
      <Sidebar
        materials={materials}
        onAnalyze={handleAnalyze}
        loading={loading}
        importedConfig={importedConfig}
        onImportConsumed={() => setImportedConfig(null)}
      />
      <main style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TabBar
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          disabled={!result}
          alwaysEnabled={['upload']}
        />
        <div style={{ flex:1, overflowY:'auto', padding:'20px', background:'#0a0c10' }}>
          {renderTab()}
        </div>
      </main>
    </div>
  )
}
