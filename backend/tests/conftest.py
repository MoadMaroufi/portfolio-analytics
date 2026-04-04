import sys
import os
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

# Add the backend directory to the path so `from main import app` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(autouse=True)
def test_settings(monkeypatch):
    monkeypatch.setenv("PORTFOLIO_API_KEY", "test-api-key")
    monkeypatch.setenv("PORTFOLIO_QDRANT_URL", "https://example.qdrant.local")
    monkeypatch.setenv("PORTFOLIO_QDRANT_API_KEY", "test-key")
    monkeypatch.setenv("PORTFOLIO_QDRANT_COLLECTION", "european_companies")
    monkeypatch.setenv("PORTFOLIO_SEMANTIC_SEARCH_DEFAULT_TOP_K", "10")
    monkeypatch.setenv("PORTFOLIO_SEMANTIC_SEARCH_MAX_TOP_K", "20")
    monkeypatch.setenv("PORTFOLIO_NVIDIA_API_KEY", "test-nvidia-key")
    monkeypatch.setenv("PORTFOLIO_NVIDIA_MODEL", "moonshotai/kimi-k2-instruct-0905")

    from config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def mock_prices():
    """
    Deterministic fake price data — patches yf.download so tests never hit the network.
    250 trading days, 3 tickers, random-walk prices seeded for reproducibility.
    """
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=250, freq="B")
    prices = pd.DataFrame(
        np.cumprod(1 + np.random.randn(250, 3) * 0.01, axis=0) * 100,
        index=dates,
        columns=pd.Index(["AAPL", "MSFT", "GOOG"]),
    )

    class _FakeDownload:
        def __getitem__(self, key):
            return prices

    with patch("services.market_data.yf.download", return_value=_FakeDownload()):
        yield prices


@pytest.fixture
def mock_semantic_services():
    fake_results = [
        {
            "ticker": "MC.PA",
            "name": "LVMH",
            "description": "Luxury goods company.",
            "sector": "Consumer Cyclical",
            "industry": "Luxury Goods",
            "country": "France",
            "exchange": "Paris",
            "score": 0.91,
        },
        {
            "ticker": "RMS.PA",
            "name": "Hermes",
            "description": "Luxury fashion house.",
            "sector": "Consumer Cyclical",
            "industry": "Luxury Goods",
            "country": "France",
            "exchange": "Paris",
            "score": 0.88,
        },
    ]

    with (
        patch("main.embed_query", return_value=[0.1, 0.2, 0.3]),
        patch("main.search_companies", return_value=fake_results),
        patch(
            "main.generate_semantic_recommendations",
            return_value=(
                [
                    {
                        **fake_results[0],
                        "weight": 0.55,
                        "rationale": "Strong match for European luxury demand.",
                    },
                    {
                        **fake_results[1],
                        "weight": 0.45,
                        "rationale": "High-end brand exposure within the same theme.",
                    },
                ],
                "This portfolio emphasizes leading European luxury brands.",
            ),
        ),
    ):
        yield


@pytest.fixture
def mock_semantic_services_empty():
    with (
        patch("main.embed_query", return_value=[0.1, 0.2, 0.3]),
        patch("main.search_companies", return_value=[]),
        patch(
            "main.generate_semantic_recommendations",
            return_value=([], "No relevant companies were found for this query."),
        ),
    ):
        yield


@pytest.fixture
def mock_semantic_services_fallback():
    fake_results = [
        {
            "ticker": "MC.PA",
            "name": "LVMH",
            "description": "Luxury goods company.",
            "sector": "Consumer Cyclical",
            "industry": "Luxury Goods",
            "country": "France",
            "exchange": "Paris",
            "score": 0.91,
        },
        {
            "ticker": "RMS.PA",
            "name": "Hermes",
            "description": "Luxury fashion house.",
            "sector": "Consumer Cyclical",
            "industry": "Luxury Goods",
            "country": "France",
            "exchange": "Paris",
            "score": 0.88,
        },
    ]

    with (
        patch("main.embed_query", return_value=[0.1, 0.2, 0.3]),
        patch("main.search_companies", return_value=fake_results),
        patch(
            "main.generate_semantic_recommendations", side_effect=ValueError("bad json")
        ),
    ):
        yield
