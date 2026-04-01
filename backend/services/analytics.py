import numpy as np
import pandas as pd

from config import Settings
from models import AnalyzeResponse


def compute_portfolio_metrics(
    returns: pd.DataFrame,
    weights: dict[str, float],
    settings: Settings,
) -> AnalyzeResponse:
    total = sum(weights.values())
    normalized = {t: v / total for t, v in weights.items()}
    w = np.array([normalized[t] for t in returns.columns])
    port_returns = returns.values @ w

    ann_return = float((1 + port_returns.mean()) ** 252 - 1)
    ann_vol = float(port_returns.std() * np.sqrt(252))
    sharpe = float((ann_return - settings.risk_free_rate) / ann_vol) if ann_vol > 0 else 0.0

    cumulative = np.cumprod(1 + port_returns)
    peak = np.maximum.accumulate(cumulative)
    max_dd = float(((cumulative - peak) / peak).min())

    corr = returns[list(returns.columns)].corr().round(3).to_dict()

    return AnalyzeResponse(
        tickers=list(returns.columns),
        annualized_return=round(ann_return, 4),
        annualized_volatility=round(ann_vol, 4),
        sharpe_ratio=round(sharpe, 4),
        max_drawdown=round(max_dd, 4),
        correlation_matrix=corr,
    )
