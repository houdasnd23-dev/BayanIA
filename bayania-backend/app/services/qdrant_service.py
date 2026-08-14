import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)
class QdrantService:
    _client: Optional[QdrantClient] = None
    COLLECTION_NAME = "sources_juridiques"
    VECTOR_SIZE = 768  # Dimension of gemini-embedding-001 (voir embedding_service.py)
    @classmethod
    def get_client(cls) -> QdrantClient:
        if cls._client is None:
            # Check if Qdrant requires api_key
            kwargs = {}
            if settings.QDRANT_API_KEY:
                kwargs["api_key"] = settings.QDRANT_API_KEY
            cls._client = QdrantClient(url=settings.QDRANT_URL, **kwargs)
        return cls._client
    @classmethod
    async def init_collection(cls):
        """
        Creates the collection in Qdrant if it doesn't already exist.
        """
        client = cls.get_client()
        try:
            ## Check if collection exists
            client.get_collection(collection_name=cls.COLLECTION_NAME)
        except (UnexpectedResponse, Exception):
            # Collection does not exist, create it
            client.create_collection(
                collection_name=cls.COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=cls.VECTOR_SIZE,
                    distance=models.Distance.COSINE
                )
            )
    @classmethod
    async def upsert_chunks(cls, points: List[Dict[str, Any]]) -> bool:
        """
        Points should be a list of dicts with:
        - id: unique int/UUID
        - vector: List[float]
        - payload: Dict[str, Any] (e.g. {"id_source": X, "titre_document": Y, "numero_article": Z, "contenu_texte": W})
        """
        client = cls.get_client()
        await cls.init_collection()
        
        qdrant_points = [
            models.PointStruct(
                id=pt["id"],
                vector=pt["vector"],
                payload=pt["payload"]
            )
            for pt in points
        ]
        
        response = client.upsert(
            collection_name=cls.COLLECTION_NAME,
            wait=True,
            points=qdrant_points
        )
        return response.status == models.UpdateStatus.COMPLETED
    @classmethod
    async def search_similar(
        cls,
        query_vector: List[float],
        top_k: int = None,
        min_score: float = None
    ) -> List[Dict[str, Any]]:
        """
        Searches Qdrant for top_k documents similar to the query vector.
        """
        client = cls.get_client()
        await cls.init_collection()
        
        limit = top_k if top_k is not None else settings.RAG_TOP_K
        score_threshold = min_score if min_score is not None else settings.RAG_MIN_SCORE

        # DIAGNOSTIC : on récupère plus large et SANS score_threshold côté Qdrant,
        # pour voir tous les candidats bruts avant filtrage -> à retirer une fois
        # le bon seuil validé empiriquement.
        diagnostic_limit = max(limit * 3, 15)
        raw_result = client.query_points(
             collection_name=cls.COLLECTION_NAME,
             query=query_vector,
             limit=diagnostic_limit,
             query_filter=models.Filter(
             must=[models.FieldCondition(key="statut_validite", match=models.MatchValue(value=True))])
    ).points

        logger.info(f"[RAG DIAGNOSTIC] {len(raw_result)} candidats bruts (avant seuil={score_threshold}) :")
        for hit in raw_result:
            logger.info(
                f"[RAG DIAGNOSTIC]   score={hit.score:.4f} | "
                f"titre={hit.payload.get('titre_document')} | "
                f"article={hit.payload.get('numero_article')}"
            )

        # Filtrage + troncature appliqués ici (au lieu de score_threshold serveur)
        filtered = [hit for hit in raw_result if hit.score >= score_threshold][:limit]

        results = []
        for hit in filtered:
            results.append({
                "id_source": hit.payload.get("id_source"),
                "titre_document": hit.payload.get("titre_document"),
                "numero_article": hit.payload.get("numero_article"),
                "contenu_texte": hit.payload.get("contenu_texte"),
                "type_source": hit.payload.get("type_source"),
                "score": hit.score
            })

        return results
    @classmethod
    async def delete_points(cls, source_ids: List[int]) -> bool:
        """
         Supprime les points Qdrant correspondant aux ids donnés.
         """
        client = cls.get_client()
        try:
            client.delete(
               collection_name=cls.COLLECTION_NAME,
               points_selector=source_ids,
             )
            return True
        except Exception:
          return False