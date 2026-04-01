from contextlib import contextmanager
from typing import Generator

import pandas as pd
import yfinance as yf

from exceptions import DataFetchError, TickerNotFoundError


@contextmanager
def fetch_closing_prices(
    tickers: list[str],
    period: str = "1y",
) -> Generator[pd.DataFrame, None, None]:
    raw = yf.download(tickers, period=period, auto_adjust=True, progress=False)["Close"]

    # yfinance returns a Series when passed a single-element list in some versions
    if isinstance(raw, pd.Series):
        raw = raw.to_frame(name=tickers[0])

    raw = raw.dropna(axis=1, how="all")

    missing = [t for t in tickers if t not in raw.columns]
    if missing:
        raise TickerNotFoundError(missing)

    yield raw
