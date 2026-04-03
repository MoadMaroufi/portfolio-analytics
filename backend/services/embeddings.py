from typing import Any


_embedding_model: Any | None = None
_embedding_model_name: str | None = None


def load_embedding_model(model_name: str) -> Any:
    global _embedding_model, _embedding_model_name
    if _embedding_model is None or _embedding_model_name != model_name:
        from sentence_transformers import SentenceTransformer

        _embedding_model = SentenceTransformer(model_name)
        _embedding_model_name = model_name
    return _embedding_model


def get_embedding_model() -> Any:
    if _embedding_model is None:
        raise RuntimeError("Embedding model is not initialized.")
    return _embedding_model


def embed_query(text: str) -> list[float]:
    embedding = get_embedding_model().encode(text, normalize_embeddings=True)
    return embedding.tolist()


def reset_embedding_model() -> None:
    global _embedding_model, _embedding_model_name
    _embedding_model = None
    _embedding_model_name = None
