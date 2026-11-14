import { Menu, Sparkles, RefreshCw, UploadCloud } from 'lucide-react'
import { useApp } from '../../context/useApp'

const TAB_TITLES = {
  overview: {
    title: 'Financial Overview',
    subtitle: 'Consolidated executive metrics and deterministic department analysis',
  },
  financial: {
    title: 'Financial Analysis',
    subtitle: 'Upload CSV, review budget vs. actual variance, and explore departmental metrics',
  },
  documents: {
    title: 'Financial Documents',
    subtitle: 'Upload PDF reports, inspect extracted chunks, and manage the vector knowledge base',
  },
  copilot: {
    title: 'AI Copilot & Tools',
    subtitle: 'Ask evidence-grounded questions with citations or execute approved financial tools',
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Backend connection status, API endpoints, and configuration parameters',
  },
}

export function Header({ setMobileOpen }) {
  const {
    activeTab,
    setActiveTab,
    financialData,
    loadSampleFinancials,
    loadingFinancial,
  } = useApp()

  const currentMeta = TAB_TITLES[activeTab] || TAB_TITLES.overview

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile toggle + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {!financialData && (
            <button
              onClick={loadSampleFinancials}
              disabled={loadingFinancial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
            >
              {loadingFinancial ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Load Sample Data
            </button>
          )}

          {activeTab !== 'financial' && (
            <button
              onClick={() => setActiveTab('financial')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              Upload CSV
            </button>
          )}

          {financialData && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[140px] font-semibold">{financialData.sourceName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
