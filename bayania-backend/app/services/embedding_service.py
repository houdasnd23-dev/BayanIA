import asyncio
from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


class EmbeddingService:
    @classmethod
    async def get_embedding(cls, text: str):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
            )
        )
        return result.embeddings[0].values
