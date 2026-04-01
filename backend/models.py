from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    weights: dict[str, float]


class AnalyzeResponse(BaseModel):
    tickers: list[str]
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    correlation_matrix: dict[str, dict[str, float]]


class OptimizeRequest(BaseModel):
    tickers: list[str]


class FrontierPoint(BaseModel):
    volatility: float
    expected_return: float
    sharpe: float


class OptimizeResponse(BaseModel):
    optimal_weights: dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    frontier: list[FrontierPoint]
