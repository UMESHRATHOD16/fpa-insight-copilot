import { useApp } from '../context/useApp'
import { CsvUploader } from '../components/financial/CsvUploader'
import { DepartmentTable } from '../components/financial/DepartmentTable'
import { OverviewKpis } from '../components/dashboard/OverviewKpis'
import { BudgetVsActualChart } from '../components/dashboard/BudgetVsActualChart'
import { VarianceBarChart } from '../components/dashboard/VarianceBarChart'
import { InsightsSection } from '../components/dashboard/InsightsSection'
import { Trash2, AlertCircle } from 'lucide-react'

export function FinancialAnalysis() {
  const { financialData, clearFinancialData, financialError } = useApp()

  return (
    <div className="space-y-6">
      {/* CSV Ingestion Component */}
      <CsvUploader />

      {financialError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{financialError}</span>
        </div>
      )}

      {/* Dataset Controls Header if data is loaded */}
      {financialData && (
        <>
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 px-5 py-3 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Current Dataset</span>
              <div className="text-sm font-bold text-slate-900">
                {financialData.sourceName}{' '}
                {financialData.isSample && (
                  <span className="ml-1 text-[11px] font-normal text-slate-400">(Synthetic Sample)</span>
                )}
              </div>
            </div>
            <button
              onClick={clearFinancialData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Dataset
            </button>
          </div>

          {/* Financial KPIs */}
          <OverviewKpis summary={financialData.summary} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Department Spending vs. Budget
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of actual disbursements against allocated target
              </p>
              <BudgetVsActualChart departments={financialData.summary.departments} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Net Variance by Department
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Positive (amber) = overspending; Negative (green) = savings
              </p>
              <VarianceBarChart departments={financialData.summary.departments} />
            </div>
          </div>

          {/* Department Detail Table */}
          <DepartmentTable departments={financialData.summary.departments} />

          {/* Deterministic Rule-Based Insights & AI Commentary */}
          <InsightsSection
            insights={financialData.insights}
            aiExplanation={financialData.aiExplanation}
          />
        </>
      )}
    </div>
  )
}
