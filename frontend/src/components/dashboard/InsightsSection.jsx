import { Lightbulb, Sparkles, AlertTriangle, ShieldCheck, Info } from 'lucide-react'

export function InsightsSection({ insights, aiExplanation }) {
  const severityStyles = {
    high: {
      border: 'border-rose-200',
      bg: 'bg-rose-50/60',
      badge: 'bg-rose-100 text-rose-800',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
    },
    medium: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/60',
      badge: 'bg-amber-100 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-blue-50/60',
      badge: 'bg-blue-100 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    efficiency: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/60',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
    },
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Deterministic Financial Insights
            </h3>
            <p className="text-xs text-slate-500">
              Rule-based facts computed directly by the backend engine
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {insights?.length || 0} Findings
        </span>
      </div>

      {/* Deterministic insights cards */}
      {(!insights || insights.length === 0) ? (
        <p className="text-xs text-slate-500 py-2">
          No specific variance alerts or findings generated for this dataset.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((item, idx) => {
            const style =
              item.category === 'efficiency'
                ? severityStyles.efficiency
                : severityStyles[item.severity] || severityStyles.info
            const Icon = style.icon

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${style.badge}`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AI Commentary if available */}
      {aiExplanation && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Executive AI Commentary
            </h4>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {aiExplanation}
          </div>
        </div>
      )}
    </div>
  )
}
