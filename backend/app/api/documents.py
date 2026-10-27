from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.documents import (
    DocumentChunk,
    DocumentListResponse,
    DocumentSummary,
    DocumentUploadResponse,
    DeleteDocumentResponse,
)
from app.services.pdf_service import extract_and_chunk_pdf
from app.services.retrieval_service import retrieval_service

router = APIRouter(prefix="/documents", tags=["Documents & PDF Ingestion"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload and ingest a financial PDF document",
    description="Validates PDF, extracts page-level text, splits into chunks, and indexes embeddings into ChromaDB.",
)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .pdf documents are supported.",
        )

    try:
        content = await file.read()
        summary, chunks = extract_and_chunk_pdf(content, file.filename)
        retrieval_service.index_document(summary, chunks)

        return DocumentUploadResponse(
            document_id=summary.document_id,
            filename=summary.filename,
            page_count=summary.page_count,
            chunk_count=summary.chunk_count,
            message="Document successfully processed and indexed.",
            preview_chunks=chunks[:3],
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while indexing the PDF: {str(exc)}",
        )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all indexed documents",
    description="Returns metadata for all documents currently indexed in the vector store.",
)
def list_documents():
    docs = retrieval_service.list_documents()
    return DocumentListResponse(
        documents=docs,
        total_documents=len(docs),
    )


@router.get(
    "/{document_id}",
    response_model=DocumentSummary,
    summary="Get document details by ID",
)
def get_document(document_id: str):
    doc = retrieval_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return doc


@router.get(
    "/{document_id}/chunks",
    response_model=List[DocumentChunk],
    summary="Get all text chunks for an indexed document",
)
def get_document_chunks(document_id: str):
    doc = retrieval_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return retrieval_service.get_document_chunks(document_id)


@router.delete(
    "/{document_id}",
    response_model=DeleteDocumentResponse,
    summary="Delete an indexed document",
    description="Removes document chunks, embeddings, and metadata from ChromaDB and registry.",
)
def delete_document(document_id: str):
    deleted = retrieval_service.delete_document(document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return DeleteDocumentResponse(
        document_id=document_id,
        deleted=True,
        message=f"Document '{document_id}' and its vector embeddings were successfully deleted.",
    )
