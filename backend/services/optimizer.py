import numpy as np
import pandas as pd
from scipy.optimize import minimize, OptimizeResult
from sklearn.covariance import LedoitWolf

from config import Settings
from exceptions import OptimizationFailedError
from models import FrontierPoint, OptimizeResponse


def _compute_ledoit_wolf_cov(returns: np.ndarray) -> np.ndarray:
    lw = LedoitWolf()
    lw.fit(returns)
    return lw.covariance_ * 252


def _portfolio_stats(
    weights: np.ndarray,
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    risk_free_rate: float,
) -> tuple[float, float, float]:
    ret = float(weights @ mean_returns)
    vol = float(np.sqrt(weights @ cov_matrix @ weights))
    sharpe = (ret - risk_free_rate) / vol if vol > 0 else 0.0
    return ret, vol, sharpe


def _monte_carlo_frontier(
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    risk_free_rate: float,
    n_samples: int,
) -> list[FrontierPoint]:
    n = len(mean_returns)
    points = []
    for _ in range(n_samples):
        # Dirichlet gives uniform sampling over the long-only simplex (weights >= 0, sum = 1)
        w = np.random.dirichlet(np.ones(n))
        ret, vol, sharpe = _portfolio_stats(w, mean_returns, cov_matrix, risk_free_rate)
        points.append(FrontierPoint(
            volatility=round(vol, 4),
            expected_return=round(ret, 4),
            sharpe=round(sharpe, 4),
        ))
    return sorted(points, key=lambda p: p.volatility)


def optimize_portfolio(prices: pd.DataFrame, settings: Settings) -> OptimizeResponse:
    returns = np.log(prices / prices.shift(1)).dropna()
    n = returns.shape[1]

    if len(returns) < n * 2:
        raise OptimizationFailedError(
            f"Insufficient data: need at least {n * 2} trading days for {n} tickers, got {len(returns)}."
        )

    mean_ret = returns.mean().values * 252
    cov_matrix = _compute_ledoit_wolf_cov(returns.values)
    tickers = list(prices.columns)

    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]
    # Keep the configured cap, but ensure feasibility for long-only weights summing to 1.
    # If max_weight_per_asset is below 1/n, no feasible portfolio exists.
    max_w = max(min(settings.max_weight_per_asset, 1.0), 1.0 / n)
    bounds = tuple((0.0, max_w) for _ in range(n))
    x0 = np.full(n, 1.0 / n)

    result: OptimizeResult = minimize(
        fun=lambda w, cov: float(w @ cov @ w),
        x0=x0,
        args=(cov_matrix,),
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"maxiter": 1000, "ftol": 1e-9},
    )

    if not result.success:
        raise OptimizationFailedError(reason=result.message)

    optimal_w = result.x
    exp_ret, exp_vol, sharpe = _portfolio_stats(optimal_w, mean_ret, cov_matrix, settings.risk_free_rate)

    frontier = _monte_carlo_frontier(
        mean_ret, cov_matrix, settings.risk_free_rate, settings.monte_carlo_samples
    )

    return OptimizeResponse(
        optimal_weights={t: round(float(w), 4) for t, w in zip(tickers, optimal_w)},
        expected_return=round(exp_ret, 4),
        expected_volatility=round(exp_vol, 4),
        sharpe_ratio=round(sharpe, 4),
        frontier=frontier,
    )
