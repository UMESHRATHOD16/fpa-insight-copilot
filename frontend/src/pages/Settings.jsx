import { useState } from 'react'
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import { API_BASE_URL, checkBackendHealth } from '../services/api'

export function Settings() {
  const {
    backendOnline,
    checkHealth,
    clearFinancialData,
    documents,
    financialData,
    showToast,
  } = useApp()

  const [testingConnection, setTestingConnection] = useState(false)

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const res = await checkBackendHealth()
      await checkHealth()
      if (res.online) {
        showToast('Successfully verified backend connection', 'success')
      } else {
        showToast('Backend is currently unreachable', 'error')
      }
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* System Status Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Backend Connection & Health</h3>
              <p className="text-xs text-slate-500">FastAPI API server status and connection endpoint</p>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            Test Connection
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium">Status</span>
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {backendOnline ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Healthy & Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700">Unreachable</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium">API Base URL</span>
            <div className="font-mono text-slate-900 font-semibold truncate">
              {API_BASE_URL}
            </div>
          </div>
        </div>
      </div>

      {/* Model & AI Settings */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Models & Embeddings</h3>
            <p className="text-xs text-slate-500">Google Gemini and ChromaDB integration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium">LLM Model</span>
            <div className="font-semibold text-slate-900">gemini-2.5-flash</div>
            <p className="text-[11px] text-slate-400">
              Fallback: Deterministic extractive synthesis in offline mode
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium">Embedding Model</span>
            <div className="font-semibold text-slate-900">text-embedding-004</div>
            <p className="text-[11px] text-slate-400">
              Fallback: Term-frequency hash vectors in offline mode
            </p>
          </div>
        </div>
      </div>

      {/* Local State & Storage */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Session & Data</h3>
            <p className="text-xs text-slate-500">Currently loaded financial analysis and indexed documents</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Financial Dataset:</span>{' '}
              <span className="text-slate-600">
                {financialData ? financialData.sourceName : 'None loaded'}
              </span>
            </div>
            {financialData && (
              <button
                onClick={clearFinancialData}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Clear Data
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Vector Store Documents:</span>{' '}
              <span className="text-slate-600">{documents.length} PDF reports indexed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Shield className="w-4 h-4 text-emerald-400" />
          Enterprise Security Architecture
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          All mathematical operations (budget totals, actuals, department variances) are computed deterministically via Python Decimal library in the backend. AI models are strictly prohibited from generating authoritative arithmetic. All document passages are wrapped with boundary isolation tokens before LLM evaluation.
        </p>
      </div>
    </div>
  )
}
