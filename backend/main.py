from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings, get_settings
from exceptions import (
    DataFetchError,
    InsufficientTickersError,
    OptimizationFailedError,
    TickerNotFoundError,
    TooManyTickersError,
    data_fetch_handler,
    insufficient_tickers_handler,
    optimization_failed_handler,
    ticker_not_found_handler,
    too_many_tickers_handler,
)
from models import AnalyzeRequest, AnalyzeResponse, OptimizeRequest, OptimizeResponse
from services.analytics import compute_portfolio_metrics
from services.market_data import fetch_closing_prices
from services.optimizer import optimize_portfolio
from fastapi import Depends

app = FastAPI(title="Portfolio API", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.add_exception_handler(InsufficientTickersError, insufficient_tickers_handler)
app.add_exception_handler(TickerNotFoundError, ticker_not_found_handler)
app.add_exception_handler(OptimizationFailedError, optimization_failed_handler)
app.add_exception_handler(DataFetchError, data_fetch_handler)
app.add_exception_handler(TooManyTickersError, too_many_tickers_handler)


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, settings: Settings = Depends(get_settings)):
    if len(req.weights) < 2:
        raise InsufficientTickersError(minimum=2)
    with fetch_closing_prices(list(req.weights.keys()), period=settings.data_period) as prices:
        returns = prices.pct_change().dropna()
        return compute_portfolio_metrics(returns, req.weights, settings)


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest, settings: Settings = Depends(get_settings)):
    if len(req.tickers) < 2:
        raise InsufficientTickersError(minimum=2)
    if len(req.tickers) > settings.max_tickers:
        raise TooManyTickersError(maximum=settings.max_tickers)
    with fetch_closing_prices(req.tickers, period=settings.data_period) as prices:
        return optimize_portfolio(prices, settings)
