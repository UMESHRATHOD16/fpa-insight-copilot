export function KpiCard({
  title,
  value,
  subtext,
  badgeText,
  badgeVariant = 'neutral', // 'neutral' | 'success' | 'warning' | 'danger'
  icon: Icon,
}) {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 truncate">
          {value}
        </div>
        {badgeText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[badgeVariant] || badgeStyles.neutral}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 truncate">{subtext}</p>
      )}
    </div>
  )
}
