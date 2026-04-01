from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# --- /analyze ---

def test_single_ticker_rejected():
    """Only 1 ticker should return 400."""
    res = client.post("/analyze", json={"weights": {"AAPL": 1.0}})
    assert res.status_code == 400


def test_fake_ticker_rejected():
    """A ticker that doesn't exist on Yahoo should return 404."""
    res = client.post("/analyze", json={"weights": {"FAKETICKER123": 0.5, "ANOTHERFAKE": 0.5}})
    assert res.status_code == 404


def test_weights_not_summing_to_1():
    """Weights like 30/30 (sum=60) should still work — we normalize internally."""
    res = client.post("/analyze", json={"weights": {"AAPL": 30, "MSFT": 30}})
    # Either succeeds (200) or fails to fetch data (404) — but never a 400 or 500
    assert res.status_code in (200, 404)


def test_empty_weights_rejected():
    """Empty portfolio should return 400."""
    res = client.post("/analyze", json={"weights": {}})
    assert res.status_code == 400


# --- /optimize validation (no network) ---

def test_optimize_single_ticker_rejected():
    res = client.post("/optimize", json={"tickers": ["AAPL"]})
    assert res.status_code == 400


def test_optimize_empty_tickers_rejected():
    res = client.post("/optimize", json={"tickers": []})
    assert res.status_code == 400


def test_optimize_fake_tickers_rejected():
    res = client.post("/optimize", json={"tickers": ["FAKETICKER1", "FAKETICKER2"]})
    assert res.status_code == 404


# --- /optimize response shape (mocked prices) ---

def test_optimize_response_shape(mock_prices):
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]})
    assert res.status_code == 200
    data = res.json()
    assert set(data.keys()) == {
        "optimal_weights", "expected_return", "expected_volatility", "sharpe_ratio", "frontier"
    }


def test_optimize_weights_sum_to_one(mock_prices):
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]})
    assert res.status_code == 200
    weights = res.json()["optimal_weights"]
    assert abs(sum(weights.values()) - 1.0) < 1e-3


def test_optimize_long_only_no_negative_weights(mock_prices):
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT", "GOOG"]})
    assert res.status_code == 200
    weights = res.json()["optimal_weights"]
    assert all(w >= -1e-6 for w in weights.values())


def test_optimize_frontier_count(mock_prices):
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT"]})
    assert res.status_code == 200
    assert len(res.json()["frontier"]) == 2000


def test_optimize_frontier_point_shape(mock_prices):
    res = client.post("/optimize", json={"tickers": ["AAPL", "MSFT"]})
    assert res.status_code == 200
    point = res.json()["frontier"][0]
    assert set(point.keys()) == {"volatility", "expected_return", "sharpe"}
