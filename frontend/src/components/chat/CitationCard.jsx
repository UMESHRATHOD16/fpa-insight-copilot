import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

export function CitationCard({ citation, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs hover:border-slate-300 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-200">
            [{index + 1}]
          </span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 truncate">
            <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{citation.filename}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
            Page {citation.page_number}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-0.5">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-slate-600 font-sans leading-relaxed text-[11px] bg-slate-50/70 p-2 rounded-lg italic">
          "{citation.snippet}"
        </div>
      )}
    </div>
  )
}
