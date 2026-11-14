import { useState } from 'react'
import { useApp } from '../context/useApp'
import { PdfUploader } from '../components/documents/PdfUploader'
import { DocumentList } from '../components/documents/DocumentList'
import { ChunkViewerModal } from '../components/documents/ChunkViewerModal'
import { DeleteConfirmModal } from '../components/documents/DeleteConfirmModal'
import { documentService } from '../services/documentService'
import { KpiCard } from '../components/common/KpiCard'
import { FileText, Layers, HardDrive } from 'lucide-react'

export function Documents() {
  const {
    documents,
    loadingDocuments,
    fetchDocuments,
    showToast,
  } = useApp()

  const [inspectDoc, setInspectDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)

  const totalPages = documents.reduce((acc, doc) => acc + (doc.page_count || 0), 0)
  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0)

  const handleDeleteConfirm = async (documentId) => {
    try {
      await documentService.deleteDocument(documentId)
      showToast('Document and vector embeddings deleted', 'success')
      await fetchDocuments()
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Indexed Documents"
          value={documents.length}
          subtext="Reports stored in ChromaDB"
          icon={FileText}
        />
        <KpiCard
          title="Total Document Pages"
          value={totalPages}
          subtext="Extracted text pages"
          icon={HardDrive}
        />
        <KpiCard
          title="Total Vector Chunks"
          value={totalChunks}
          subtext="Embedded passages for retrieval"
          icon={Layers}
        />
      </div>

      {/* PDF Uploader */}
      <PdfUploader />

      {/* Document List Table */}
      <DocumentList
        documents={documents}
        loading={loadingDocuments}
        onViewChunks={(doc) => setInspectDoc(doc)}
        onDeleteDoc={(doc) => setDeleteDoc(doc)}
      />

      {/* Chunk Viewer Modal */}
      <ChunkViewerModal
        isOpen={Boolean(inspectDoc)}
        onClose={() => setInspectDoc(null)}
        documentSummary={inspectDoc}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteDoc)}
        onClose={() => setDeleteDoc(null)}
        documentSummary={deleteDoc}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  )
}
