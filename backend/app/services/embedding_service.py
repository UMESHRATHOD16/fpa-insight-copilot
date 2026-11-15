import hashlib
import math
import re
from typing import List, Optional

from app.core.config import settings

EMBEDDING_DIM = 256


def _deterministic_hash_vector(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Produce a deterministic, normalized term-frequency / n-gram vector for offline/test environments.
    Words with overlapping vocabulary will naturally exhibit high cosine similarity.
    """
    vec = [0.0] * dim
    words = re.findall(r"\w+", text.lower())
    if not words:
        return [1.0 / math.sqrt(dim)] * dim

    for w in words:
        # Hash each token to a vector dimension
        h = int(hashlib.sha256(w.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0

    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        return [v / norm for v in vec]
    return [1.0 / math.sqrt(dim)] * dim


class EmbeddingService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.EMBEDDING_MODEL
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception:
                self._client = None

    @property
    def is_live_provider(self) -> bool:
        return self._client is not None


    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate one embedding vector for each document chunk."""
        if not texts:
            return []

        if self._client:
            try:
                vectors = []

                for text in texts:
                    response = self._client.models.embed_content(
                        model=self.model,
                        contents=text,
                    )

                    if not response.embeddings:
                        raise ValueError("Embedding API returned an empty response")

                    vectors.append(list(response.embeddings[0].values))

                if len(vectors) == len(texts):
                    return vectors

            except Exception as exc:
                print(f"Gemini embedding failed: {exc}")
                print("Using offline fallback embeddings.")

        return [_deterministic_hash_vector(t) for t in texts]


    def get_query_embedding(self, query: str) -> List[float]:
        """Generate an embedding vector for a single query string."""
        vectors = self.get_embeddings([query])
        return vectors[0] if vectors else [0.0] * EMBEDDING_DIM


# Global embedding service singleton
embedding_service = EmbeddingService()
