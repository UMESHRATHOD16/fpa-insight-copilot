import { useState } from 'react'
import { Modal } from '../common/Modal'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function DeleteConfirmModal({
  isOpen,
  onClose,
  documentSummary,
  onConfirmDelete,
}) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirmDelete(documentSummary.document_id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Indexed Document"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            Are you sure you want to delete <strong>{documentSummary?.filename}</strong>?
            This will permanently remove its extracted chunks and vector embeddings from ChromaDB.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
