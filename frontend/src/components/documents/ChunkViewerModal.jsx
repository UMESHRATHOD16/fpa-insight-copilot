import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { documentService } from '../../services/documentService'
import { RefreshCw, FileText, Hash } from 'lucide-react'

function ChunkListBody({ documentSummary }) {
  const [chunks, setChunks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    documentService
      .getDocumentChunks(documentSummary.document_id)
      .then((data) => {
        if (active) {
          setChunks(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [documentSummary.document_id])

  return (
    <div className="space-y-4">
      {/* Document Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-900">{documentSummary.filename}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <span>Pages: <strong>{documentSummary.page_count}</strong></span>
          <span>Chunks: <strong>{documentSummary.chunk_count}</strong></span>
          <span>ID: <code className="text-slate-500">{documentSummary.document_id.slice(0, 8)}...</code></span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs">Loading chunks from vector store...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
          Failed to load chunks: {error}
        </div>
      )}

      {/* Chunks List */}
      {!loading && !error && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {chunks.map((chunk, index) => (
            <div
              key={chunk.chunk_id || index}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Hash className="w-3 h-3 text-slate-500" /> Chunk {chunk.chunk_index + 1}
                  </span>
                  <span className="text-slate-500">
                    Page <strong>{chunk.page_number}</strong>
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {chunk.character_count} chars
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                {chunk.text}
              </p>
            </div>
          ))}

          {chunks.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No text chunks found for this document.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ChunkViewerModal({ isOpen, onClose, documentSummary }) {
  if (!isOpen || !documentSummary) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Document Chunks: ${documentSummary.filename || 'Document'}`}
      maxWidth="max-w-4xl"
    >
      <ChunkListBody documentSummary={documentSummary} />
    </Modal>
  )
}
