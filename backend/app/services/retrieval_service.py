import json
import os
from pathlib import Path
from typing import Dict, List, Optional
import chromadb

from app.core.config import settings
from app.schemas.chat import RetrievedChunk
from app.schemas.documents import DocumentChunk, DocumentSummary
from app.services.embedding_service import embedding_service

CHROMA_COLLECTION_NAME = "fpa_documents"


class RetrievalService:
    def __init__(self, persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIRECTORY
        Path(self.persist_dir).mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(path=self.persist_dir)
        self._collection = self._client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"description": "FP&A Financial Document Chunks"},
        )
        self._registry_path = Path(self.persist_dir) / "document_registry.json"
        self._registry: Dict[str, dict] = self._load_registry()

    def _load_registry(self) -> Dict[str, dict]:
        if self._registry_path.exists():
            try:
                with open(self._registry_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_registry(self) -> None:
        try:
            with open(self._registry_path, "w", encoding="utf-8") as f:
                json.dump(self._registry, f, indent=2)
        except Exception:
            pass

    def index_document(self, summary: DocumentSummary, chunks: List[DocumentChunk]) -> None:
        """Embed and index chunks into ChromaDB and store document metadata."""
        if not chunks:
            return

        texts = [c.text for c in chunks]
        embeddings = embedding_service.get_embeddings(texts)

        ids = [c.chunk_id for c in chunks]
        metadatas = [
            {
                "document_id": c.document_id,
                "filename": c.filename,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
            }
            for c in chunks
        ]

        self._collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        # Update registry
        self._registry[summary.document_id] = summary.model_dump()
        self._save_registry()

    def list_documents(self) -> List[DocumentSummary]:
        """Return all indexed documents sorted by upload time descending."""
        docs = [DocumentSummary(**data) for data in self._registry.values()]
        docs.sort(key=lambda d: d.upload_time, reverse=True)
        return docs

    def get_document(self, document_id: str) -> Optional[DocumentSummary]:
        """Get summary for a single document."""
        data = self._registry.get(document_id)
        if data:
            return DocumentSummary(**data)
        return None

    def get_document_chunks(self, document_id: str) -> List[DocumentChunk]:
        """Retrieve all stored chunks for a specific document."""
        results = self._collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"],
        )
        chunks: List[DocumentChunk] = []
        if results and "ids" in results and results["ids"]:
            for i, chunk_id in enumerate(results["ids"]):
                meta = results["metadatas"][i]
                text = results["documents"][i]
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=meta["document_id"],
                        filename=meta["filename"],
                        page_number=meta["page_number"],
                        chunk_index=meta["chunk_index"],
                        text=text,
                        character_count=len(text),
                    )
                )
        chunks.sort(key=lambda c: (c.page_number, c.chunk_index))
        return chunks

    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks and metadata for a document."""
        if document_id not in self._registry:
            return False

        try:
            self._collection.delete(where={"document_id": document_id})
        except Exception:
            pass

        del self._registry[document_id]
        self._save_registry()
        return True

    def retrieve_chunks(
        self,
        query: str,
        top_k: int = 4,
        document_id: Optional[str] = None,
    ) -> List[RetrievedChunk]:
        """
        Query vector collection for relevant chunks given a user query.
        """
        total_count = self._collection.count()
        if total_count == 0:
            return []

        query_emb = embedding_service.get_query_embedding(query)
        where_filter = {"document_id": document_id} if document_id else None

        actual_k = min(top_k, total_count)
        if actual_k <= 0:
            return []

        try:
            results = self._collection.query(
                query_embeddings=[query_emb],
                n_results=actual_k,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            return []

        retrieved: List[RetrievedChunk] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return []

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results.get("distances", [[0.0] * len(ids)])[0]

        for i, chunk_id in enumerate(ids):
            # Chroma default L2 distance: lower distance = higher similarity
            dist = distances[i] if i < len(distances) else 0.0
            similarity = max(0.0, 1.0 - (dist / 2.0))

            meta = metas[i]
            retrieved.append(
                RetrievedChunk(
                    chunk_id=chunk_id,
                    document_id=meta["document_id"],
                    filename=meta["filename"],
                    page_number=meta["page_number"],
                    text=docs[i],
                    similarity_score=round(similarity, 4),
                )
            )

        return retrieved

    def reset_index(self) -> None:
        """Utility for test suites to clear all stored vectors and registry."""
        try:
            self._client.delete_collection(name=CHROMA_COLLECTION_NAME)
        except Exception:
            pass
        self._collection = self._client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"description": "FP&A Financial Document Chunks"},
        )
        self._registry = {}
        self._save_registry()


# Global retrieval service singleton
retrieval_service = RetrievalService()
