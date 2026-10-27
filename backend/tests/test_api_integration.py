from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.retrieval_service import retrieval_service
from tests.pdf_utils import create_sample_pdf

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_index():
    retrieval_service.reset_index()
    yield
    retrieval_service.reset_index()


def test_openapi_schema_has_all_endpoints():
    res = client.get("/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    paths = schema["paths"]

    # Health
    assert "/" in paths
    assert "/health" in paths

    # Financial
    assert "/api/financial/analyze" in paths
    assert "/api/financial/upload" in paths
    assert "/api/financial/insights" in paths
    assert "/api/financial/sample" in paths

    # Documents
    assert "/api/documents/upload" in paths
    assert "/api/documents" in paths
    assert "/api/documents/{document_id}" in paths
    assert "/api/documents/{document_id}/chunks" in paths

    # Chat
    assert "/api/chat/ask" in paths
    assert "/api/chat/tool" in paths
    assert "/api/chat/tools" in paths


def test_full_csv_analysis_workflow():
    sample_path = Path(__file__).parent.parent / "data" / "samples" / "sample_financials.csv"
    with open(sample_path, "rb") as f:
        csv_bytes = f.read()

    # 1. Upload CSV
    upload_res = client.post(
        "/api/financial/upload",
        files={"file": ("sample_financials.csv", csv_bytes, "text/csv")},
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["valid_rows"] == 10
    assert upload_data["summary"]["total_budget"] > 0
    assert upload_data["summary"]["total_actual"] > 0

    # 2. Call insights endpoint using the parsed records
    records = upload_data["preview"]
    insights_res = client.post(
        "/api/financial/insights",
        json={"records": records},
    )
    assert insights_res.status_code == 200
    insights_data = insights_res.json()
    assert len(insights_data["deterministic_insights"]) > 0
    assert insights_data["summary"]["department_count"] == len(records)

    # 3. Test sample endpoint returns data that can be directly analyzed
    sample_res = client.get("/api/financial/sample")
    assert sample_res.status_code == 200
    sample_data = sample_res.json()
    assert len(sample_data["records"]) == 10

    analyze_res = client.post(
        "/api/financial/analyze",
        json=sample_data,
    )
    assert analyze_res.status_code == 200
    assert analyze_res.json()["department_count"] == 10


def test_full_pdf_rag_and_agent_workflow():
    report_text = (
        "FP&A Q1 Summary:\n"
        "Customer Acquisition Cost (CAC) declined to $120 per user.\n"
        "Gross Margin expanded by 240 basis points to 68 percent."
    )
    pdf_bytes = create_sample_pdf(report_text, pages=1)

    # 1. Ingest PDF
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("performance.pdf", pdf_bytes, "application/pdf")},
    )
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document_id"]

    # 2. Query RAG
    chat_res = client.post(
        "/api/chat/ask",
        json={"question": "What happened to Gross Margin in Q1?", "top_k": 2},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data["citations"]) >= 1
    assert chat_data["citations"][0]["filename"] == "performance.pdf"
    assert "68 percent" in chat_data["answer"] or "Gross Margin" in chat_data["answer"]

    # 3. Use controlled tool to search document
    tool_res = client.post(
        "/api/chat/tool",
        json={
            "prompt": "Find information on Customer Acquisition Cost",
            "tool_name": "search_financial_documents",
            "arguments": {"query": "Customer Acquisition Cost", "top_k": 2},
        },
    )
    assert tool_res.status_code == 200
    tool_data = tool_res.json()
    assert len(tool_data["tool_executions"]) == 1
    assert tool_data["tool_executions"][0]["status"] == "success"
    assert len(tool_data["citations"]) >= 1

    # 4. Clean up document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True
