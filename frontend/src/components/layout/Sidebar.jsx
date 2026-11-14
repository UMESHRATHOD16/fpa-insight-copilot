import {
  LayoutDashboard,
  LineChart,
  FileText,
  Bot,
  Settings,
  Database,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react'
import { useApp } from '../../context/useApp'

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { activeTab, setActiveTab, backendOnline, documents, financialData } = useApp()

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'KPIs & executive metrics',
    },
    {
      id: 'financial',
      label: 'Financial Analysis',
      icon: LineChart,
      description: 'Variance & department data',
      badge: financialData?.summary ? `${financialData.summary.department_count} depts` : null,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'PDF reports & vector store',
      badge: documents.length > 0 ? `${documents.length}` : null,
    },
    {
      id: 'copilot',
      label: 'AI Copilot',
      icon: Bot,
      description: 'RAG Q&A & controlled tools',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'API & system config',
    },
  ]

  const handleNavClick = (tabId) => {
    setActiveTab(tabId)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                FP&A Insight Copilot
              </h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise Analytics</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset status banner */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-slate-800/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Active Dataset</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                financialData ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  financialData ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
              {financialData ? 'Loaded' : 'No Data'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium truncate">
            {financialData ? financialData.sourceName : 'Load sample or CSV'}
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-left truncate">
                    <div className="truncate font-medium">{item.label}</div>
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Backend health footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 text-xs">
            <span className="text-slate-400 font-medium">FastAPI Backend</span>
            <div className="flex items-center gap-1.5">
              {backendOnline === true ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Online</span>
                </>
              ) : backendOnline === false ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-semibold">Offline</span>
                </>
              ) : (
                <span className="text-slate-400">Checking...</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
