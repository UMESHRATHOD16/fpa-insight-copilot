import { useApp } from '../context/useApp'
import { OverviewKpis } from '../components/dashboard/OverviewKpis'
import { BudgetVsActualChart } from '../components/dashboard/BudgetVsActualChart'
import { VarianceBarChart } from '../components/dashboard/VarianceBarChart'
import { DepartmentRankings } from '../components/dashboard/DepartmentRankings'
import { InsightsSection } from '../components/dashboard/InsightsSection'
import { RecentDocumentsWidget } from '../components/dashboard/RecentDocumentsWidget'
import { EmptyFinancialState } from '../components/dashboard/EmptyFinancialState'
import { AlertBanner } from '../components/common/AlertBanner'
import { MessageSquare, BarChart3 } from 'lucide-react'

export function Overview() {
  const {
    financialData,
    backendOnline,
    setActiveTab,
    financialError,
  } = useApp()

  return (
    <div className="space-y-6">
      {/* Backend connection alert */}
      {backendOnline === false && (
        <AlertBanner
          type="error"
          title="Backend Connection Warning"
          message="FastAPI backend is unreachable at http://localhost:8000. Please start the server with: uvicorn app.main:app --reload"
        />
      )}

      {financialError && (
        <AlertBanner
          type="error"
          title="Financial Processing Error"
          message={financialError}
        />
      )}

      {!financialData ? (
        <EmptyFinancialState />
      ) : (
        <>
          {/* Top KPI Cards */}
          <OverviewKpis summary={financialData.summary} />

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Analysis Scope</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                  {financialData.sourceName}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('financial')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Dataset Details</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {financialData.summary.department_count} Departments · {financialData.summary.record_count} Records
                </p>
              </div>
              <button
                onClick={() => setActiveTab('financial')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Explore
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">RAG Assistance</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Ask Document Questions
                </p>
              </div>
              <button
                onClick={() => setActiveTab('copilot')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask Copilot
              </button>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Budget vs. Actual Spending
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department-level side-by-side comparison
                  </p>
                </div>
              </div>
              <BudgetVsActualChart departments={financialData.summary.departments} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Variance Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Overspending (amber) vs. Savings (green)
                  </p>
                </div>
              </div>
              <VarianceBarChart departments={financialData.summary.departments} />
            </div>
          </div>

          {/* Overspending / Underspending Rankings */}
          <DepartmentRankings summary={financialData.summary} />

          {/* Deterministic Financial Insights & AI commentary */}
          <InsightsSection
            insights={financialData.insights}
            aiExplanation={financialData.aiExplanation}
          />

          {/* Recent Indexed Documents Widget */}
          <RecentDocumentsWidget />
        </>
      )}
    </div>
  )
}
