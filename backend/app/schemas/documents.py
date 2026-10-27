from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """A chunk of extracted text with source location metadata."""
    chunk_id: str
    document_id: str
    filename: str
    page_number: int
    chunk_index: int
    text: str
    character_count: int


class DocumentSummary(BaseModel):
    """Metadata summary of an ingested document."""
    document_id: str
    filename: str
    file_size_bytes: int
    page_count: int
    chunk_count: int
    upload_time: str
    status: str = "indexed"


class DocumentUploadResponse(BaseModel):
    """Response returned upon successful PDF ingestion."""
    document_id: str
    filename: str
    page_count: int
    chunk_count: int
    message: str
    preview_chunks: List[DocumentChunk] = []


class DocumentListResponse(BaseModel):
    """List of all currently indexed documents."""
    documents: List[DocumentSummary]
    total_documents: int


class DeleteDocumentResponse(BaseModel):
    """Response returned when a document is deleted."""
    document_id: str
    deleted: bool
    message: str
