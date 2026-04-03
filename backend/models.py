from pydantic import BaseModel
from pydantic import Field


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


class SemanticSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1)


class Recommendation(BaseModel):
    ticker: str
    name: str
    weight: float
    rationale: str
    description: str
    sector: str
    industry: str
    country: str
    exchange: str
    score: float


class SemanticSearchResponse(BaseModel):
    query: str
    top_k: int
    retrieved_count: int
    recommendations: list[Recommendation]
    explanation: str
