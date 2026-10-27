import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.pdf_service import extract_and_chunk_pdf, split_text_into_chunks
from app.services.retrieval_service import retrieval_service
from tests.pdf_utils import create_sample_pdf, create_blank_pdf

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_retrieval_index():
    retrieval_service.reset_index()
    yield
    retrieval_service.reset_index()


def test_split_text_into_chunks_boundaries():
    text = (
        "Paragraph 1: Budget allocation for marketing was set at $500,000.\n\n"
        "Paragraph 2: Operating expenditures exceeded projections by 10%.\n\n"
        "Paragraph 3: Executive leadership approved cloud cost optimizations."
    )
    chunks = split_text_into_chunks(text, chunk_size=80, chunk_overlap=20)
    assert len(chunks) >= 2
    # Check that chunks contain meaningful content
    assert any("Budget allocation" in c for c in chunks)
    assert any("Operating expenditures" in c for c in chunks)


def test_extract_and_chunk_valid_pdf():
    pdf_bytes = create_sample_pdf("Acme Corp Q1 Earnings: Net income grew by 18 percent.", pages=2)
    summary, chunks = extract_and_chunk_pdf(pdf_bytes, "acme_q1.pdf")

    assert summary.filename == "acme_q1.pdf"
    assert summary.page_count == 2
    assert summary.chunk_count == len(chunks)
    assert len(chunks) >= 2
    assert chunks[0].page_number == 1
    assert "Acme Corp Q1 Earnings" in chunks[0].text


def test_blank_pdf_rejected():
    blank_bytes = create_blank_pdf()
    with pytest.raises(ValueError, match="no extractable text"):
        extract_and_chunk_pdf(blank_bytes, "blank.pdf")


def test_invalid_pdf_header_rejected():
    with pytest.raises(ValueError, match="not a valid PDF"):
        extract_and_chunk_pdf(b"This is not a PDF file", "fake.pdf")


def test_empty_pdf_rejected():
    with pytest.raises(ValueError, match="empty"):
        extract_and_chunk_pdf(b"", "empty.pdf")


def test_document_api_upload_list_chunks_delete():
    pdf_bytes = create_sample_pdf("Testing API document ingestion and retrieval.", pages=1)

    # 1. Upload
    response = client.post(
        "/api/documents/upload",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    doc_id = data["document_id"]
    assert data["filename"] == "report.pdf"
    assert data["chunk_count"] >= 1
    assert len(data["preview_chunks"]) >= 1

    # 2. List
    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    docs = list_res.json()["documents"]
    assert any(d["document_id"] == doc_id for d in docs)

    # 3. Get document details
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["document_id"] == doc_id

    # 4. Get chunks
    chunks_res = client.get(f"/api/documents/{doc_id}/chunks")
    assert chunks_res.status_code == 200
    chunks = chunks_res.json()
    assert len(chunks) >= 1
    assert "Testing API document" in chunks[0]["text"]

    # 5. Delete document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

    # 6. Verify deleted
    get_res2 = client.get(f"/api/documents/{doc_id}")
    assert get_res2.status_code == 404
