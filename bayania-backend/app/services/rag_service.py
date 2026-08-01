from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Tuple, List, Dict, Any
from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.llm_service import LLMService
from app.services.confidence_service import ConfidenceService
class RAGService:
    @classmethod
    async def process_question(
        cls,
        db: AsyncSession,
        anonymized_question: str
    ) -> Tuple[str, List[SourceJuridique], float]:
        """
        Orchestrates the RAG flow:
        1. Embeds the anonymized question.
        2. Queries Qdrant vector database.
        3. Generates prompt and invokes LLM.
        4. Calculates confidence score.
        5. Returns response text, cited database sources, and confidence score.
        """
        # 1. Embed query
        query_vector = await EmbeddingService.get_embedding(anonymized_question)
        
        # 2. Retrieve top-k documents from Qdrant
        rag_hits = await QdrantService.search_similar(query_vector)
        
        if not rag_hits:
            # Fallback when no relevant context is retrieved
            empty_response = (
                "Désolé, aucune source juridique pertinente n'a été trouvée "
                "dans notre base de données pour répondre à votre question."
            )
            return empty_response, [], 0.0
            
        # 3. Call LLM Service with retrieved chunks
        response_text = await LLMService.generate_response(anonymized_question, rag_hits)
        
        # 4. Fetch the SourceJuridique ORM objects from the database using the IDs
        source_ids = [hit["id_source"] for hit in rag_hits if hit["id_source"] is not None]
        
        cited_sources: List[SourceJuridique] = []
        if source_ids:
            stmt = select(SourceJuridique).where(SourceJuridique.id_source.in_(source_ids))
            result = await db.execute(stmt)
            cited_sources = list(result.scalars().all())
            
            # 5. Calculate confidence score
        confidence = await ConfidenceService.calculate_score(
            response_text=response_text,
            retrieved_sources=rag_hits,
        )

        # 6. Return response, cited sources and confidence value
        return (
            response_text,
            cited_sources,
            confidence["confidence"],
        )