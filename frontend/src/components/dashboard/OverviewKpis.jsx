import { DollarSign, TrendingUp, TrendingDown, PieChart, Layers } from 'lucide-react'
import { KpiCard } from '../common/KpiCard'
import { formatCurrency, formatPercent, formatVariance } from '../../utils/formatters'

export function OverviewKpis({ summary }) {
  if (!summary) return null

  const varianceInfo = formatVariance(summary.variance)
  const isOver = summary.variance > 0
  const isUnder = summary.variance < 0

  const varianceBadge = isOver
    ? `${formatPercent(summary.variance_percentage)} Over`
    : isUnder
    ? `${formatPercent(summary.variance_percentage)} Under`
    : 'On Target'

  const varianceVariant = isOver ? 'warning' : isUnder ? 'success' : 'neutral'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <KpiCard
          title="Total Budget"
          value={formatCurrency(summary.total_budget)}
          subtext={`${summary.department_count} departments tracked`}
          badgeText="Target"
          badgeVariant="neutral"
          icon={DollarSign}
        />

        {/* Total Actual Spending */}
        <KpiCard
          title="Total Actual Spending"
          value={formatCurrency(summary.total_actual)}
          subtext={`${summary.record_count} total financial records`}
          badgeText="Spent"
          badgeVariant="neutral"
          icon={PieChart}
        />

        {/* Net Variance */}
        <KpiCard
          title="Total Variance"
          value={varianceInfo.text}
          subtext={varianceInfo.label}
          badgeText={varianceBadge}
          badgeVariant={varianceVariant}
          icon={isOver ? TrendingUp : TrendingDown}
        />

        {/* Variance Percentage */}
        <KpiCard
          title="Variance %"
          value={formatPercent(summary.variance_percentage)}
          subtext={
            summary.total_budget > 0
              ? `Relative to total budget`
              : 'Zero base budget'
          }
          badgeText={isOver ? 'Exceeded' : isUnder ? 'Favorable' : 'Balanced'}
          badgeVariant={varianceVariant}
          icon={Layers}
        />
      </div>

      {/* Optional Financial Metrics (Revenue, Expenses, Profit) when available */}
      {summary.optional_metrics && (summary.optional_metrics.total_revenue !== null || summary.optional_metrics.total_expenses !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {summary.optional_metrics.total_revenue !== null && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(summary.optional_metrics.total_revenue)}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Revenue</span>
            </div>
          )}

          {summary.optional_metrics.total_expenses !== null && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Expenses</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(summary.optional_metrics.total_expenses)}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">Expenses</span>
            </div>
          )}

          {summary.optional_metrics.net_profit !== null && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Net Profit</span>
                <div className={`text-lg font-bold mt-0.5 ${summary.optional_metrics.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(summary.optional_metrics.net_profit)}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${summary.optional_metrics.net_profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                Profit
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
