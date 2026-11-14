import { LineChart, Sparkles, UploadCloud, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/useApp'

export function EmptyFinancialState() {
  const { loadSampleFinancials, loadingFinancial, setActiveTab } = useApp()

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-xs max-w-2xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
        <LineChart className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        No Financial Dataset Loaded
      </h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
        Upload a departmental financial CSV file to analyze variances, or immediately load
        the pre-validated synthetic sample data directly from the backend.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={loadSampleFinancials}
          disabled={loadingFinancial}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
        >
          {loadingFinancial ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Load Sample Financial Data
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
        >
          <UploadCloud className="w-4 h-4 text-slate-500" />
          Upload Financial CSV
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
        Supported CSV format includes required headers:{' '}
        <code className="text-slate-600 font-mono">department</code>,{' '}
        <code className="text-slate-600 font-mono">budget</code>,{' '}
        <code className="text-slate-600 font-mono">actual</code>
      </div>
    </div>
  )
}
