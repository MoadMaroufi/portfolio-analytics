import logging
from contextlib import asynccontextmanager

from fastapi import Depends
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
from models import (
    AnalyzeRequest,
    AnalyzeResponse,
    OptimizeRequest,
    OptimizeResponse,
    Recommendation,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from services.analytics import compute_portfolio_metrics
from services.embeddings import embed_query, load_embedding_model, reset_embedding_model
from services.market_data import fetch_closing_prices
from services.nvidia_llm import (
    build_fallback_recommendations,
    generate_semantic_recommendations,
)
from services.optimizer import optimize_portfolio
from services.qdrant_client import (
    init_qdrant_client,
    reset_qdrant_client,
    search_companies,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.qdrant_url:
        load_embedding_model(settings.embedding_model_name)
        init_qdrant_client(settings.qdrant_url, settings.qdrant_api_key)

    yield

    reset_embedding_model()
    reset_qdrant_client()


app = FastAPI(title="Portfolio API", version="2.0.0", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=settings.cors_methods_list,
    allow_headers=settings.cors_headers_list,
    allow_credentials=True,
)

app.add_exception_handler(InsufficientTickersError, insufficient_tickers_handler)  # pyright: ignore[reportArgumentType]
app.add_exception_handler(TickerNotFoundError, ticker_not_found_handler)  # pyright: ignore[reportArgumentType]
app.add_exception_handler(OptimizationFailedError, optimization_failed_handler)  # pyright: ignore[reportArgumentType]
app.add_exception_handler(DataFetchError, data_fetch_handler)  # pyright: ignore[reportArgumentType]
app.add_exception_handler(TooManyTickersError, too_many_tickers_handler)  # pyright: ignore[reportArgumentType]


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, settings: Settings = Depends(get_settings)):
    if len(req.weights) < 2:
        raise InsufficientTickersError(minimum=2)
    with fetch_closing_prices(
        list(req.weights.keys()), period=settings.data_period
    ) as prices:
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


@app.post("/semantic-search", response_model=SemanticSearchResponse)
def semantic_search(
    req: SemanticSearchRequest, settings: Settings = Depends(get_settings)
):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if not settings.qdrant_url:
        raise HTTPException(status_code=500, detail="Qdrant is not configured.")

    top_k = req.top_k or settings.semantic_search_default_top_k
    if top_k > settings.semantic_search_max_top_k:
        raise HTTPException(
            status_code=400,
            detail=f"top_k exceeds maximum of {settings.semantic_search_max_top_k}.",
        )

    try:
        query_vector = embed_query(query)
        results = search_companies(query_vector, settings.qdrant_collection, top_k)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Semantic retrieval failed: {exc}"
        ) from exc

    try:
        recommendations, explanation = generate_semantic_recommendations(
            query, results, settings
        )
    except Exception as e:
        logger.error(f"NVIDIA LLM error: {e}", exc_info=True)
        recommendations, explanation = build_fallback_recommendations(results)

    return SemanticSearchResponse(
        query=query,
        top_k=top_k,
        retrieved_count=len(results),
        recommendations=[Recommendation(**item) for item in recommendations],
        explanation=explanation,
    )
