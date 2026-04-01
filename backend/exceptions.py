from fastapi import Request
from fastapi.responses import JSONResponse


class InsufficientTickersError(Exception):
    def __init__(self, minimum: int = 2):
        self.minimum = minimum
        super().__init__(f"Need at least {minimum} tickers.")


class TickerNotFoundError(Exception):
    def __init__(self, missing: list[str]):
        self.missing = missing
        super().__init__(f"No data for: {missing}")


class OptimizationFailedError(Exception):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


class DataFetchError(Exception):
    def __init__(self, detail: str):
        super().__init__(detail)


class TooManyTickersError(Exception):
    def __init__(self, maximum: int):
        self.maximum = maximum
        super().__init__(f"Too many tickers: maximum is {maximum}.")


async def insufficient_tickers_handler(request: Request, exc: InsufficientTickersError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


async def ticker_not_found_handler(request: Request, exc: TickerNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


async def optimization_failed_handler(request: Request, exc: OptimizationFailedError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


async def data_fetch_handler(request: Request, exc: DataFetchError) -> JSONResponse:
    return JSONResponse(status_code=502, content={"detail": str(exc)})


async def too_many_tickers_handler(request: Request, exc: TooManyTickersError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})
