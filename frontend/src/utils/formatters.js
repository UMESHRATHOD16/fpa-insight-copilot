/**
 * Financial and general formatting utilities
 */

export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—'
  }
  const numeric = Number(amount)

  if (compact) {
    if (Math.abs(numeric) >= 1_000_000) {
      return `$${(numeric / 1_000_000).toFixed(2)}M`
    }
    if (Math.abs(numeric) >= 1_000) {
      return `$${(numeric / 1_000).toFixed(1)}K`
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function formatPercent(percent) {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return 'N/A'
  }
  const numeric = Number(percent)
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(1)}%`
}

export function formatVariance(variance) {
  if (variance === null || variance === undefined || isNaN(variance)) {
    return { text: '—', status: 'neutral', isOver: false }
  }
  const num = Number(variance)
  // Positive = actual > budget = Over budget (unfavorable)
  // Negative = actual < budget = Under budget (favorable)
  if (num > 0) {
    return {
      text: `+${formatCurrency(num)}`,
      status: 'over',
      label: 'Over Budget',
      isOver: true,
    }
  }
  if (num < 0) {
    return {
      text: `-${formatCurrency(Math.abs(num))}`,
      status: 'under',
      label: 'Under Budget (Savings)',
      isOver: false,
    }
  }
  return {
    text: '$0',
    status: 'on_budget',
    label: 'On Budget',
    isOver: false,
  }
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateString
  }
}
