import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const budget = payload.find((p) => p.dataKey === 'budget')?.value
    const actual = payload.find((p) => p.dataKey === 'actual')?.value
    const variance = (actual ?? 0) - (budget ?? 0)

    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
        <p className="font-bold text-slate-800 text-sm">{label}</p>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
            Budget:
          </span>
          <span className="font-semibold text-slate-900">{formatCurrency(budget)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
            Actual:
          </span>
          <span className="font-semibold text-slate-900">{formatCurrency(actual)}</span>
        </div>
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4">
          <span className="font-medium text-slate-500">Variance:</span>
          <span
            className={`font-bold ${
              variance > 0
                ? 'text-amber-600'
                : variance < 0
                ? 'text-emerald-600'
                : 'text-slate-600'
            }`}
          >
            {variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function BudgetVsActualChart({ departments }) {
  if (!departments || departments.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No department data available
      </div>
    )
  }

  // Format data for chart
  const chartData = departments.map((d) => ({
    name: d.department,
    budget: d.budget,
    actual: d.actual,
    variance: d.variance,
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 10, left: 10, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          <Bar
            name="Budget"
            dataKey="budget"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Actual Spending"
            dataKey="actual"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
