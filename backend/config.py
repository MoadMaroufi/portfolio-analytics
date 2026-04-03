from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    risk_free_rate: float = 0.05
    data_period: str = "1y"
    max_tickers: int = 20
    monte_carlo_samples: int = 2000
    max_weight_per_asset: float = 0.4
    embedding_model_name: str = "BAAI/bge-large-en-v1.5"
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    qdrant_collection: str = "european_companies"
    semantic_search_default_top_k: int = 10
    semantic_search_max_top_k: int = 20
    nvidia_api_key: str | None = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "moonshotai/kimi-k2-instruct-0905"
    llm_temperature: float = 0.6
    llm_top_p: float = 0.9
    llm_max_tokens: int = 4096

    # CORS configuration
    cors_origins: str = (
        "https://portfolio-analytics-murex.vercel.app,http://localhost:3000"
    )
    cors_methods: str = "POST,OPTIONS"
    cors_headers: str = "Content-Type,Authorization"

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def cors_methods_list(self) -> list[str]:
        return [
            method.strip() for method in self.cors_methods.split(",") if method.strip()
        ]

    @property
    def cors_headers_list(self) -> list[str]:
        return [
            header.strip() for header in self.cors_headers.split(",") if header.strip()
        ]

    model_config = {
        "env_prefix": "PORTFOLIO_",
        "env_file": ".env",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
