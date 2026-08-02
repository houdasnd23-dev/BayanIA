import asyncio
from typing import Optional

from google import genai
from google.genai import types

from app.core.config import settings

# IMPORTANT : ne PAS créer le client ici au niveau module -> si GEMINI_API_KEY
# est vide/absente, ça ferait planter TOUT le serveur au démarrage (import time),
# pas seulement cette fonctionnalité. On le crée à la demande à la place.
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY manquante -- impossible de générer les embeddings."
            )
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


class EmbeddingService:
    @classmethod
    async def get_embedding(cls, text: str):
        loop = asyncio.get_event_loop()
        client = _get_client()
        result = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768),
            )
        )
        return result.embeddings[0].values