import os

from fastapi.testclient import TestClient

os.environ.setdefault("PORTFOLIO_API_KEY", "test-api-key")

from main import app

client = TestClient(app)


def auth_headers(key: str = "test-api-key") -> dict[str, str]:
    return {"X-API-Key": key}


def test_analyze_requires_api_key():
    res = client.post("/analyze", json={"weights": {"AAPL": 50, "MSFT": 50}})
    assert res.status_code == 401


def test_optimize_requires_api_key():
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT"]})
    assert res.status_code == 401


def test_semantic_search_requires_api_key():
    res = client.post("/semantic-search", json={"query": "European luxury"})
    assert res.status_code == 401


def test_invalid_api_key_rejected():
    res = client.post(
        "/analyze",
        json={"weights": {"AAPL": 50, "MSFT": 50}},
        headers=auth_headers("wrong-key"),
    )
    assert res.status_code == 401


# --- /analyze ---


def test_single_ticker_rejected():
    """Only 1 ticker should return 400."""
    res = client.post(
        "/analyze", json={"weights": {"AAPL": 1.0}}, headers=auth_headers()
    )
    assert res.status_code == 400


def test_fake_ticker_rejected():
    """A ticker that doesn't exist on Yahoo should return 404."""
    res = client.post(
        "/analyze",
        json={"weights": {"FAKETICKER123": 0.5, "ANOTHERFAKE": 0.5}},
        headers=auth_headers(),
    )
    assert res.status_code == 404


def test_weights_not_summing_to_1():
    """Weights like 30/30 (sum=60) should still work — we normalize internally."""
    res = client.post(
        "/analyze", json={"weights": {"AAPL": 30, "MSFT": 30}}, headers=auth_headers()
    )
    # Either succeeds (200) or fails to fetch data (404) — but never a 400 or 500
    assert res.status_code in (200, 404)


def test_empty_weights_rejected():
    """Empty portfolio should return 400."""
    res = client.post("/analyze", json={"weights": {}}, headers=auth_headers())
    assert res.status_code == 400


# --- /optimize validation (no network) ---


def test_optimize_single_ticker_rejected():
    res = client.post("/optimize", json={"tickers": ["AAPL"]}, headers=auth_headers())
    assert res.status_code == 400


def test_optimize_empty_tickers_rejected():
    res = client.post("/optimize", json={"tickers": []}, headers=auth_headers())
    assert res.status_code == 400


def test_optimize_fake_tickers_rejected():
    res = client.post(
        "/optimize",
        json={"tickers": ["FAKETICKER1", "FAKETICKER2"]},
        headers=auth_headers(),
    )
    assert res.status_code == 404


# --- /optimize response shape (mocked prices) ---


def test_optimize_response_shape(mock_prices):
    res = client.post(
        "/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]}, headers=auth_headers()
    )
    assert res.status_code == 200
    data = res.json()
    assert set(data.keys()) == {
        "optimal_weights",
        "expected_return",
        "expected_volatility",
        "sharpe_ratio",
        "frontier",
    }


def test_optimize_weights_sum_to_one(mock_prices):
    res = client.post(
        "/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]}, headers=auth_headers()
    )
    assert res.status_code == 200
    weights = res.json()["optimal_weights"]
    assert abs(sum(weights.values()) - 1.0) < 1e-3


def test_optimize_long_only_no_negative_weights(mock_prices):
    res = client.post(
        "/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]}, headers=auth_headers()
    )
    assert res.status_code == 200
    weights = res.json()["optimal_weights"]
    assert all(w >= -1e-6 for w in weights.values())


def test_optimize_frontier_count(mock_prices):
    res = client.post(
        "/optimize", json={"tickers": ["AAPL", "MSFT"]}, headers=auth_headers()
    )
    assert res.status_code == 200
    assert len(res.json()["frontier"]) == 2000


def test_optimize_frontier_point_shape(mock_prices):
    res = client.post(
        "/optimize", json={"tickers": ["AAPL", "MSFT"]}, headers=auth_headers()
    )
    assert res.status_code == 200
    point = res.json()["frontier"][0]
    assert set(point.keys()) == {"volatility", "expected_return", "sharpe"}


# --- /semantic-search ---


def test_semantic_search_blank_query_rejected():
    res = client.post(
        "/semantic-search", json={"query": "   "}, headers=auth_headers()
    )
    assert res.status_code == 400


def test_semantic_search_top_k_too_large_rejected(test_settings):
    res = client.post(
        "/semantic-search",
        json={"query": "green energy", "top_k": 99},
        headers=auth_headers(),
    )
    assert res.status_code == 400


def test_semantic_search_response_shape(mock_semantic_services):
    res = client.post(
        "/semantic-search",
        json={"query": "European luxury", "top_k": 2},
        headers=auth_headers(),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "European luxury"
    assert data["top_k"] == 2
    assert data["retrieved_count"] == 2
    assert (
        data["explanation"]
        == "This portfolio emphasizes leading European luxury brands."
    )
    assert len(data["recommendations"]) == 2
    assert set(data["recommendations"][0].keys()) == {
        "ticker",
        "name",
        "weight",
        "rationale",
        "description",
        "sector",
        "industry",
        "country",
        "exchange",
        "score",
    }


def test_semantic_search_empty_results(mock_semantic_services_empty):
    res = client.post(
        "/semantic-search", json={"query": "obscure theme"}, headers=auth_headers()
    )
    assert res.status_code == 200
    data = res.json()
    assert data["retrieved_count"] == 0
    assert data["recommendations"] == []
    assert data["explanation"] == "No relevant companies were found for this query."


def test_semantic_search_falls_back_to_qdrant_results(mock_semantic_services_fallback):
    res = client.post(
        "/semantic-search",
        json={"query": "European luxury", "top_k": 2},
        headers=auth_headers(),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["retrieved_count"] == 2
    assert len(data["recommendations"]) == 2
    assert data["explanation"] == (
        "Returned the top semantically matched companies with equal weights because "
        "the NVIDIA portfolio synthesis step was unavailable."
    )
    assert data["recommendations"][0]["weight"] == 0.5
    assert data["recommendations"][1]["weight"] == 0.5
