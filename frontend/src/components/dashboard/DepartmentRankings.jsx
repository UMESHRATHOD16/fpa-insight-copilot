import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatPercent } from '../../utils/formatters'

export function DepartmentRankings({ summary }) {
  if (!summary) return null

  // Map department names to department objects for details
  const deptMap = new Map(summary.departments.map((d) => [d.department, d]))

  const overspenders = (summary.overspending_departments || [])
    .map((name) => deptMap.get(name))
    .filter(Boolean)

  const underspenders = (summary.underspending_departments || [])
    .map((name) => deptMap.get(name))
    .filter(Boolean)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overspending Departments */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Overspending Departments
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {overspenders.length} Depts
          </span>
        </div>

        {overspenders.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>No departments currently exceed their budgeted target.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {overspenders.map((dept) => (
              <div
                key={dept.department}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {dept.department}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Budget: {formatCurrency(dept.budget)} · Spent: {formatCurrency(dept.actual)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-600">
                    +{formatCurrency(dept.variance)}
                  </div>
                  <div className="text-xs font-semibold text-amber-700/80">
                    {formatPercent(dept.variance_percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Underspending Departments */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Savings & Underspending
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {underspenders.length} Depts
          </span>
        </div>

        {underspenders.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No departments under budget.
          </div>
        ) : (
          <div className="space-y-3">
            {underspenders.map((dept) => (
              <div
                key={dept.department}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {dept.department}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Budget: {formatCurrency(dept.budget)} · Spent: {formatCurrency(dept.actual)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">
                    -{formatCurrency(Math.abs(dept.variance))}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700/80">
                    {formatPercent(dept.variance_percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
