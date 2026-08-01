import asyncio
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        return cls._model

    @classmethod
    async def get_embedding(cls, text: str):
        model = cls.get_model()
        # encode() est bloquant/CPU-bound -> on le sort de l'event loop
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(None, model.encode, text)
        return embedding