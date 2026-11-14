import { FileText, Eye, Trash2, Layers } from 'lucide-react'
import { formatBytes, formatDate } from '../../utils/formatters'

export function DocumentList({
  documents,
  loading,
  onViewChunks,
  onDeleteDoc,
}) {
  if (loading && (!documents || documents.length === 0)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
        Loading indexed documents...
      </div>
    )
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Documents Ingested</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Upload PDF reports such as financial filings, variance narratives, or board decks to enable grounded RAG question answering.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Indexed PDF Documents</h3>
          <p className="text-xs text-slate-500">
            Vectorized in ChromaDB and available for semantic retrieval
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {documents.length} Total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4">File Size</th>
              <th className="py-3 px-4 text-center">Pages</th>
              <th className="py-3 px-4 text-center">Vector Chunks</th>
              <th className="py-3 px-4">Uploaded</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.document_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{doc.filename}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {doc.document_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  {formatBytes(doc.file_size_bytes)}
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                  {doc.page_count}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Layers className="w-3 h-3" />
                    {doc.chunk_count}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {formatDate(doc.upload_time)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {doc.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewChunks(doc)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                      title="Inspect extracted chunks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                      title="Delete document and vector embeddings"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
