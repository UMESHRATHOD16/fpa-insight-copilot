import io
import re
import uuid
from datetime import datetime, timezone
from typing import List, Tuple
import pypdf

from app.core.config import settings
from app.schemas.documents import DocumentChunk, DocumentSummary

DEFAULT_CHUNK_SIZE = 700
DEFAULT_CHUNK_OVERLAP = 150


def split_text_into_chunks(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[str]:
    """
    Split text into overlapping chunks, respecting paragraph, sentence, and word boundaries.
    """
    cleaned_text = re.sub(r"\r\n|\r", "\n", text).strip()
    if not cleaned_text:
        return []

    if len(cleaned_text) <= chunk_size:
        return [cleaned_text]

    chunks: List[str] = []
    start = 0
    text_len = len(cleaned_text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # If not at the very end of text, find a clean breaking boundary
        if end < text_len:
            # Look backwards from end for paragraph, sentence, or whitespace break
            sub = cleaned_text[start:end]
            best_break = -1

            # 1. Paragraph break
            p_break = sub.rfind("\n\n")
            if p_break > chunk_size // 2:
                best_break = p_break + 2

            # 2. Sentence end (period followed by space or newline)
            if best_break == -1:
                s_break = max(sub.rfind(". "), sub.rfind(".\n"))
                if s_break > chunk_size // 2:
                    best_break = s_break + 2

            # 3. Newline break
            if best_break == -1:
                n_break = sub.rfind("\n")
                if n_break > chunk_size // 2:
                    best_break = n_break + 1

            # 4. Word boundary (space)
            if best_break == -1:
                w_break = sub.rfind(" ")
                if w_break > chunk_size // 2:
                    best_break = w_break + 1

            if best_break > 0:
                end = start + best_break

        chunk = cleaned_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Advance start with overlap
        if end >= text_len:
            break
        start = max(start + 1, end - chunk_overlap)

    return chunks


def extract_and_chunk_pdf(
    file_bytes: bytes,
    filename: str,
    document_id: str | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> Tuple[DocumentSummary, List[DocumentChunk]]:
    """
    Validate PDF bytes, extract page-level text, and split into overlapping chunks with metadata.
    """
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise ValueError(f"PDF file size exceeds maximum allowed limit of {settings.MAX_UPLOAD_MB} MB.")

    if len(file_bytes) == 0:
        raise ValueError("Uploaded PDF file is empty (0 bytes).")

    # Validate PDF signature
    if not file_bytes.startswith(b"%PDF-"):
        raise ValueError("Invalid file format. The uploaded file is not a valid PDF document.")

    safe_filename = filename.replace("\\", "/").split("/")[-1]
    doc_id = document_id or str(uuid.uuid4())

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Failed to read PDF document: {str(exc)}")

    page_count = len(reader.pages)
    if page_count == 0:
        raise ValueError("PDF document contains no pages.")

    all_chunks: List[DocumentChunk] = []
    total_extracted_chars = 0
    global_chunk_idx = 0

    for page_idx, page in enumerate(reader.pages):
        page_num = page_idx + 1
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        page_text = page_text.strip()
        total_extracted_chars += len(page_text)

        if not page_text:
            continue

        raw_chunks = split_text_into_chunks(page_text, chunk_size, chunk_overlap)
        for chunk_text in raw_chunks:
            global_chunk_idx += 1
            all_chunks.append(
                DocumentChunk(
                    chunk_id=f"{doc_id}_p{page_num}_c{global_chunk_idx}",
                    document_id=doc_id,
                    filename=safe_filename,
                    page_number=page_num,
                    chunk_index=global_chunk_idx,
                    text=chunk_text,
                    character_count=len(chunk_text),
                )
            )

    if total_extracted_chars == 0 or not all_chunks:
        raise ValueError(
            "The PDF contains no extractable text. Scanned or image-only PDFs without an OCR layer "
            "are not supported."
        )

    summary = DocumentSummary(
        document_id=doc_id,
        filename=safe_filename,
        file_size_bytes=len(file_bytes),
        page_count=page_count,
        chunk_count=len(all_chunks),
        upload_time=datetime.now(timezone.utc).isoformat(),
        status="indexed",
    )

    return summary, all_chunks
