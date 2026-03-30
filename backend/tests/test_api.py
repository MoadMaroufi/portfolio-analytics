from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


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
