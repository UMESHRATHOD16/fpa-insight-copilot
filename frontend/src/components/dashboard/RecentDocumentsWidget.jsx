import { FileText, ArrowRight, UploadCloud, Layers } from 'lucide-react'
import { useApp } from '../../context/useApp'
import { formatDate } from '../../utils/formatters'

export function RecentDocumentsWidget() {
  const { documents, setActiveTab } = useApp()

  const recent = documents.slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Financial Reports
            </h3>
            <p className="text-xs text-slate-500">Indexed for RAG document Q&A</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('documents')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          View All ({documents.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="font-medium text-slate-600">No PDF reports indexed yet</p>
          <p className="mt-1 text-slate-400">Upload 10-K, 10-Q, or budget narratives</p>
          <button
            onClick={() => setActiveTab('documents')}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload PDF Document
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recent.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-rose-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{doc.page_count} pages</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {doc.chunk_count} chunks
                    </span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                {formatDate(doc.upload_time)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
