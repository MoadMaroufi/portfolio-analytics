from typing import Any


_qdrant_client: Any | None = None


def init_qdrant_client(url: str, api_key: str | None = None) -> Any:
    global _qdrant_client
    from qdrant_client import QdrantClient

    _qdrant_client = QdrantClient(url=url, api_key=api_key)
    return _qdrant_client


def get_qdrant_client() -> Any:
    if _qdrant_client is None:
        raise RuntimeError("Qdrant client is not initialized.")
    return _qdrant_client


def search_companies(
    query_vector: list[float], collection: str, limit: int
) -> list[dict]:
    client = get_qdrant_client()
    results = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=limit,
        with_payload=True,
        with_vectors=False,
    ).points

    companies: list[dict] = []
    for result in results:
        payload = result.payload or {}
        companies.append(
            {
                "ticker": payload.get("ticker", ""),
                "name": payload.get("name", ""),
                "description": payload.get("description", ""),
                "sector": payload.get("sector", ""),
                "industry": payload.get("industry", ""),
                "country": payload.get("country", ""),
                "exchange": payload.get("exchange", ""),
                "score": float(result.score),
            }
        )
    return companies


def reset_qdrant_client() -> None:
    global _qdrant_client
    _qdrant_client = None
