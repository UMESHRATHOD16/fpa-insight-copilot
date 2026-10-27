import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.agent_service import execute_tool, get_available_tools_spec
from app.services.pdf_service import extract_and_chunk_pdf
from app.services.retrieval_service import retrieval_service
from tests.pdf_utils import create_sample_pdf

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_index():
    retrieval_service.reset_index()
    yield
    retrieval_service.reset_index()


def test_available_tools_spec():
    specs = get_available_tools_spec()
    assert len(specs) == 3
    tool_names = [s["tool_name"] for s in specs]
    assert "calculate_budget_variance" in tool_names
    assert "summarize_financial_dataset" in tool_names
    assert "search_financial_documents" in tool_names


def test_unapproved_tool_rejected():
    res = execute_tool("arbitrary_shell_exec", {"cmd": "ls -la"})
    assert res.status == "error"
    assert "not in the approved tool allowlist" in res.error_message


def test_calculate_budget_variance_tool_success():
    args = {"department": "Marketing", "budget": 100000.0, "actual": 125000.0}
    res = execute_tool("calculate_budget_variance", args)
    assert res.status == "success"
    assert res.result["department"] == "Marketing"
    assert res.result["variance"] == 25000.0
    assert res.result["status"] == "over_budget"


def test_calculate_budget_variance_tool_invalid_args():
    # Negative budget should fail schema validation
    args = {"department": "Marketing", "budget": -500.0, "actual": 100.0}
    res = execute_tool("calculate_budget_variance", args)
    assert res.status == "error"
    assert "Invalid arguments" in res.error_message


def test_summarize_financial_dataset_tool():
    args = {
        "records": [
            {"department": "Sales", "budget": 200000.0, "actual": 210000.0},
            {"department": "Support", "budget": 50000.0, "actual": 45000.0},
        ]
    }
    res = execute_tool("summarize_financial_dataset", args)
    assert res.status == "success"
    assert res.result["summary"]["total_budget"] == 250000.0
    assert res.result["summary"]["total_actual"] == 255000.0
    assert len(res.result["insights"]) >= 1


def test_search_financial_documents_tool():
    text = "The board approved a special dividend of $0.50 per share."
    pdf_bytes = create_sample_pdf(text, pages=1)
    summary, chunks = extract_and_chunk_pdf(pdf_bytes, "dividend.pdf")
    retrieval_service.index_document(summary, chunks)

    args = {"query": "special dividend", "top_k": 2}
    res = execute_tool("search_financial_documents", args)
    assert res.status == "success"
    assert res.result["results_count"] >= 1
    assert "special dividend" in res.result["chunks"][0]["text"]


def test_chat_tool_api_endpoint():
    response = client.post(
        "/api/chat/tool",
        json={
            "prompt": "Calculate marketing variance",
            "tool_name": "calculate_budget_variance",
            "arguments": {"department": "Marketing", "budget": 50000.0, "actual": 48000.0},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tool_executions"]) == 1
    assert data["tool_executions"][0]["status"] == "success"
    assert data["tool_executions"][0]["result"]["variance"] == -2000.0


def test_tools_spec_api_endpoint():
    response = client.get("/api/chat/tools")
    assert response.status_code == 200
    specs = response.json()
    assert len(specs) == 3
