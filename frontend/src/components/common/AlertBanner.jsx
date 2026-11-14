import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

export function AlertBanner({
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title,
  message,
  onClose,
  action,
}) {
  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
  }

  const current = configs[type] || configs.info
  const IconComponent = current.icon

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 text-sm ${current.bg}`}
    >
      <IconComponent className={`w-5 h-5 mt-0.5 shrink-0 ${current.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        {message && <div className="text-slate-700 leading-relaxed">{message}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
