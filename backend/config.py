from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    risk_free_rate: float = 0.05
    data_period: str = "1y"
    max_tickers: int = 20
    monte_carlo_samples: int = 2000
    max_weight_per_asset: float = 0.4

    model_config = {"env_prefix": "PORTFOLIO_"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
