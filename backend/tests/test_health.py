from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "FP&A Insight Copilot API is running!"}


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_docs_endpoint():
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_schema():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "FP&A Insight Copilot"


def test_cors_allowed_origin():
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin():
    headers = {
        "Origin": "http://unauthorized-domain.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None


def test_not_found_error_handler():
    response = client.get("/non-existent-endpoint")
    assert response.status_code == 404
    assert "detail" in response.json()
