import { useState, useRef } from 'react'
import { FileText, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { documentService } from '../../services/documentService'
import { useApp } from '../../context/useApp'

export function PdfUploader({ onUploadSuccess }) {
  const { fetchDocuments, showToast } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file type. Only PDF documents are supported.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const response = await documentService.uploadDocument(file)
      setUploadSuccess({
        filename: response.filename,
        pageCount: response.page_count,
        chunkCount: response.chunk_count,
      })
      showToast(`Document "${response.filename}" successfully indexed`, 'success')
      await fetchDocuments()
      if (onUploadSuccess) onUploadSuccess(response)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Upload Financial PDF Document</h3>
        <p className="text-xs text-slate-500">
          PDF documents are parsed page-by-page, chunked, and embedded into ChromaDB for semantic RAG search
        </p>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-slate-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            {uploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>

          <div className="text-sm font-semibold text-slate-800">
            {uploading ? (
              'Extracting text and indexing vector embeddings...'
            ) : (
              <>
                <span className="text-purple-600 hover:underline">Click to upload PDF</span> or drag and drop
              </>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Supported: 10-K, 10-Q, budget memos, quarterly reports (max 10MB)
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>{uploadSuccess.filename}</strong> successfully indexed: {uploadSuccess.pageCount} pages,{' '}
            {uploadSuccess.chunkCount} vector chunks.
          </span>
        </div>
      )}

      {/* Error Notification */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Upload Failed:</strong> {uploadError}
          </div>
        </div>
      )}
    </div>
  )
}
