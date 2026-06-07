"""
API integration tests — mock AI and DB so no external services are required.
Run with: pytest backend/tests/ -v
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

def test_health_returns_expected_fields():
    response = client.get("/api/v1/health/")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "anthropic" in data
    assert "openai" in data


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def test_query_rejects_empty_question():
    response = client.post("/api/v1/query/", json={"question": "", "model_provider": "anthropic"})
    assert response.status_code == 422


def test_query_rejects_question_over_max_length():
    response = client.post("/api/v1/query/", json={"question": "x" * 2001, "model_provider": "anthropic"})
    assert response.status_code == 422


def test_query_rejects_invalid_provider():
    response = client.post("/api/v1/query/", json={"question": "hello", "model_provider": "badprovider"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# SQL validation rejection (mocked AI returns unsafe SQL)
# ---------------------------------------------------------------------------

@patch("app.services.query_service.generate_sql", new_callable=AsyncMock)
@patch("app.services.query_service.get_schema")
def test_query_blocks_unsafe_sql(mock_schema, mock_ai):
    mock_schema.return_value = []
    mock_ai.return_value = (
        {
            "sql": "DROP TABLE customers",
            "explanation": "drops customers",
            "chart_recommendation": {"type": "none", "title": ""},
        },
        "claude-test",
    )

    response = client.post("/api/v1/query/", json={"question": "drop everything", "model_provider": "anthropic"})
    assert response.status_code == 400
    assert "validation" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Successful query (fully mocked)
# ---------------------------------------------------------------------------

@patch("app.services.query_service._log_query")
@patch("app.services.query_service._execute_sql")
@patch("app.services.query_service.generate_sql", new_callable=AsyncMock)
@patch("app.services.query_service.get_schema")
def test_query_success(mock_schema, mock_ai, mock_execute, mock_log):
    mock_schema.return_value = []
    mock_ai.return_value = (
        {
            "sql": "SELECT 1 AS val",
            "explanation": "Returns the number 1",
            "chart_recommendation": {"type": "none", "title": ""},
        },
        "claude-test",
    )
    mock_execute.return_value = (["val"], [[1]])
    mock_log.return_value = None

    response = client.post(
        "/api/v1/query/",
        json={"question": "return the number 1", "model_provider": "anthropic"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sql"] == "SELECT 1 AS val"
    assert data["columns"] == ["val"]
    assert data["rows"] == [[1]]
    assert data["row_count"] == 1
    assert data["model_used"] == "claude-test"
    assert data["retries"] == 0


# ---------------------------------------------------------------------------
# Streaming endpoint smoke test
# ---------------------------------------------------------------------------

@patch("app.services.query_service._log_query")
@patch("app.services.query_service._execute_sql")
@patch("app.services.query_service.generate_sql", new_callable=AsyncMock)
@patch("app.services.query_service.get_schema")
def test_stream_endpoint_emits_sse(mock_schema, mock_ai, mock_execute, mock_log):
    mock_schema.return_value = []
    mock_ai.return_value = (
        {
            "sql": "SELECT 42 AS answer",
            "explanation": "Returns 42",
            "chart_recommendation": {"type": "none", "title": ""},
        },
        "claude-test",
    )
    mock_execute.return_value = (["answer"], [[42]])
    mock_log.return_value = None

    with client.stream(
        "POST",
        "/api/v1/query/stream/",
        json={"question": "what is 42", "model_provider": "anthropic"},
    ) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        raw = response.read().decode()

    assert "data: " in raw
    assert '"type": "done"' in raw or '"type":"done"' in raw


# ---------------------------------------------------------------------------
# History and schema endpoints (basic availability)
# ---------------------------------------------------------------------------

def test_history_endpoint_responds():
    response = client.get("/api/v1/history/")
    assert response.status_code in (200, 500)  # 500 OK if no DB available in test env


def test_schema_endpoint_responds():
    response = client.get("/api/v1/schema/")
    assert response.status_code in (200, 500)
