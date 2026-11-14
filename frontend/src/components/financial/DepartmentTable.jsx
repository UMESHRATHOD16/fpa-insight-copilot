import { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
} from 'lucide-react'
import { formatCurrency, formatPercent } from '../../utils/formatters'

export function DepartmentTable({ departments }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'over_budget' | 'under_budget' | 'on_budget'
  const [sortKey, setSortKey] = useState('variance') // 'department' | 'budget' | 'actual' | 'variance' | 'variance_percentage'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const filtered = useMemo(() => {
    if (!departments) return []
    return departments.filter((d) => {
      const matchSearch = d.department.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [departments, search, statusFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]

      if (sortKey === 'department') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [filtered, sortKey, sortOrder])

  const exportCsv = () => {
    const headers = ['Department', 'Budget', 'Actual', 'Variance', 'Variance %', 'Status', 'Record Count']
    const rows = sorted.map((d) => [
      `"${d.department}"`,
      d.budget,
      d.actual,
      d.variance,
      d.variance_percentage !== null ? `${d.variance_percentage}%` : 'N/A',
      d.status,
      d.record_count,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'department_variance_analysis.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!departments || departments.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Department Variance Analysis</h3>
          <p className="text-xs text-slate-500">
            Showing {sorted.length} of {departments.length} departments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search department..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="over_budget">Over Budget</option>
              <option value="under_budget">Under Budget</option>
              <option value="on_budget">On Budget</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('department')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Department</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('budget')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Budget</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('actual')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Actual Spending</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('variance')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Variance ($)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('variance_percentage')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Variance (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((dept) => {
              const isOver = dept.status === 'over_budget'
              const isUnder = dept.status === 'under_budget'

              return (
                <tr
                  key={dept.department}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {dept.department}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                    {formatCurrency(dept.budget)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(dept.actual)}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-bold ${
                      isOver
                        ? 'text-amber-600'
                        : isUnder
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {isOver ? `+${formatCurrency(dept.variance)}` : formatCurrency(dept.variance)}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-semibold ${
                      isOver
                        ? 'text-amber-600'
                        : isUnder
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {formatPercent(dept.variance_percentage)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isOver
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isUnder
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isOver && <TrendingUp className="w-3 h-3" />}
                      {isUnder && <TrendingDown className="w-3 h-3" />}
                      {!isOver && !isUnder && <Minus className="w-3 h-3" />}
                      {isOver ? 'Over Budget' : isUnder ? 'Under Budget' : 'On Budget'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                    {dept.record_count}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400">
          No departments matching current filter criteria.
        </div>
      )}
    </div>
  )
}
