/**
 * Document Service - Interacts with /api/documents/* endpoints
 */
import { request } from './api'

export const documentService = {
  /**
   * Upload and index a financial PDF document
   * Returns: DocumentUploadResponse
   */
  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('file', file)

    return request('/api/documents/upload', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * List all indexed documents in the vector store
   * Returns: DocumentListResponse { documents: DocumentSummary[], total_documents: number }
   */
  async listDocuments() {
    return request('/api/documents', {
      method: 'GET',
    })
  },

  /**
   * Get metadata details for a specific document
   * Returns: DocumentSummary
   */
  async getDocument(documentId) {
    return request(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'GET',
    })
  },

  /**
   * Retrieve all text chunks and page locations for a document
   * Returns: DocumentChunk[]
   */
  async getDocumentChunks(documentId) {
    return request(`/api/documents/${encodeURIComponent(documentId)}/chunks`, {
      method: 'GET',
    })
  },

  /**
   * Delete an indexed document and its embeddings
   * Returns: DeleteDocumentResponse
   */
  async deleteDocument(documentId) {
    return request(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    })
  },
}
