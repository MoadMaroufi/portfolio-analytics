import numpy as np
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow the frontend (running on a different port) to call this API
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# --- Input model ---
# weights is a dict like {"AAPL": 0.5, "MSFT": 0.5}
class PortfolioRequest(BaseModel):
    weights: dict[str, float]


@app.post("/analyze")
def analyze(req: PortfolioRequest):
    tickers = list(req.weights.keys())

    if len(tickers) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tickers.")

    # Normalize weights so they always sum to 1, even if user inputs 50/50 instead of 0.5/0.5
    total = sum(req.weights.values())
    weights = {t: v / total for t, v in req.weights.items()}

    # Fetch 1 year of daily closing prices from Yahoo Finance
    raw = yf.download(tickers, period="1y", auto_adjust=True, progress=False)["Close"]

    # Drop any ticker that returned no data
    raw = raw.dropna(axis=1, how="all")
    missing = [t for t in tickers if t not in raw.columns]
    if missing:
        raise HTTPException(status_code=404, detail=f"No data for: {missing}")

    # Daily returns: (price_today - price_yesterday) / price_yesterday
    returns = raw.pct_change().dropna()

    # Portfolio daily return = weighted sum of individual returns
    w = np.array([weights[t] for t in raw.columns])
    port_returns = returns.values @ w  # matrix multiply: shape (days,)

    # --- Metrics ---

    # Annualized return: compound daily return over 252 trading days
    ann_return = float((1 + port_returns.mean()) ** 252 - 1)

    # Annualized volatility: std of daily returns scaled to a year
    ann_vol = float(port_returns.std() * np.sqrt(252))

    # Sharpe ratio: return per unit of risk (assuming 5% risk-free rate)
    sharpe = float((ann_return - 0.05) / ann_vol) if ann_vol > 0 else 0.0

    # Max drawdown: largest peak-to-trough drop in portfolio value
    cumulative = np.cumprod(1 + port_returns)
    peak = np.maximum.accumulate(cumulative)
    drawdown = (cumulative - peak) / peak
    max_dd = float(drawdown.min())

    # Correlation matrix between individual assets (not the portfolio)
    corr = returns[list(raw.columns)].corr().round(3).to_dict()

    return {
        "tickers": list(raw.columns),
        "annualized_return": round(ann_return, 4),
        "annualized_volatility": round(ann_vol, 4),
        "sharpe_ratio": round(sharpe, 4),
        "max_drawdown": round(max_dd, 4),
        "correlation_matrix": corr,
    }