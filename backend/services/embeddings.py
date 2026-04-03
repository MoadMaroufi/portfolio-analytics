import os
from typing import Any

from config import get_settings


_embedding_model: Any | None = None
_embedding_model_name: str | None = None


def _set_hf_token() -> None:
    """Set HF_TOKEN from config to enable authenticated HuggingFace Hub access."""
    settings = get_settings()
    if settings.huggingface_token and not os.environ.get("HF_TOKEN"):
        os.environ["HF_TOKEN"] = settings.huggingface_token


def load_embedding_model(model_name: str) -> Any:
    global _embedding_model, _embedding_model_name
    if _embedding_model is None or _embedding_model_name != model_name:
        _set_hf_token()
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
