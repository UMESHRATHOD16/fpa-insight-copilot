import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { formatCurrency, formatPercent } from '../../utils/formatters'

function CustomVarianceTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const isOver = data.variance > 0
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
        <p className="font-bold text-slate-800">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Variance:</span>
          <span
            className={`font-bold ${
              isOver ? 'text-amber-600' : data.variance < 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {isOver ? `+${formatCurrency(data.variance)}` : formatCurrency(data.variance)}
          </span>
        </div>
        {data.variance_percentage !== null && (
          <div className="flex items-center justify-between gap-4 text-slate-500">
            <span>Variance %:</span>
            <span className="font-semibold text-slate-800">
              {formatPercent(data.variance_percentage)}
            </span>
          </div>
        )}
        <div className="pt-1 text-[11px] font-medium text-slate-500">
          Status:{' '}
          <span
            className={
              isOver ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'
            }
          >
            {isOver ? 'Over Budget' : 'Under Budget'}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function VarianceBarChart({ departments }) {
  if (!departments || departments.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No variance data available
      </div>
    )
  }

  const chartData = departments.map((d) => ({
    name: d.department,
    variance: d.variance,
    variance_percentage: d.variance_percentage,
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
          <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />
          <Tooltip content={<CustomVarianceTooltip />} />
          <Bar dataKey="variance" radius={[4, 4, 4, 4]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.variance > 0 ? '#f59e0b' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
