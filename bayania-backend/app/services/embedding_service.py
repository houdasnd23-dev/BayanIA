import asyncio
from sentence_transformers import SentenceTransformer
from typing import List
from app.core.config import settings
class EmbeddingService:
    _model = None
    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            # sentence-transformers loads all-MiniLM-L6-v2 which generates 384-dimensional vectors
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model
    @classmethod
    async def get_embedding(cls, text: str) -> List[float]:
        """
        Generates embedding for a single text chunk in a threadpool executor.
        """
        loop = asyncio.get_running_loop()
        model = cls.get_model()
        embedding = await loop.run_in_executor(None, lambda: model.encode(text).tolist())
        return embedding
    @classmethod
    async def get_embedding(cls, text: str) -> List[float]:
        """
        Generates embedding for a single text chunk in a threadpool executor.
        """
        loop = asyncio.get_running_loop()
        model = cls.get_model()
        embedding = await loop.run_in_executor(None, lambda: model.encode(text).tolist())
        return embedding
    @classmethod
    async def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of text chunks.
        """
        if not texts:
            return []
        loop = asyncio.get_running_loop()
        model = cls.get_model()
        embeddings = await loop.run_in_executor(None, lambda: model.encode(texts).tolist())
        return embeddings