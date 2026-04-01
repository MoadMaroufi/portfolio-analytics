import sys
import os
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

# Add the backend directory to the path so `from main import app` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


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
        columns=["AAPL", "MSFT", "GOOG"],
    )

    class _FakeDownload:
        def __getitem__(self, key):
            return prices

    with patch("services.market_data.yf.download", return_value=_FakeDownload()):
        yield prices
