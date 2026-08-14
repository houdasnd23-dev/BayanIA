import re
import logging
from typing import List, Dict, Any

import numpy as np

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class ConfidenceService:
    """
    Score de confiance basé sur 3 signaux indépendants :

    1. Retrieval  (40%) — qualité des documents retrouvés par Qdrant
                          (meilleur résultat + moyenne, pas juste la moyenne)
    2. Citation   (20%) — l'article est-il explicitement cité dans la réponse ?
                          (regex à limites de mots, pas un simple "in")
    3. Groundedness (40%) — chaque phrase de la réponse est-elle sémantiquement
                          proche d'au moins un des chunks de contexte fournis ?
                          C'est le signal le plus important contre l'hallucination :
                          un article correctement cité mais dont l'explication
                          invente des détails absents du contexte sera détecté ici.
    """

    INSUFFICIENT_MARKERS = [
        "informations insuffisantes",
        "aucune source juridique pertinente",
        "ne permettent pas de répondre",
        "ne permet pas de répondre",
    ]

    GROUNDEDNESS_THRESHOLD = 0.6  # à calibrer empiriquement sur un jeu de test
    MIN_SENTENCE_LENGTH = 15      # ignore les fragments trop courts ("Réponse", "Explication"...)

    @classmethod
    async def calculate_score(
        cls,
        response_text: str,
        retrieved_sources: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        if not retrieved_sources:
            return {
                "confidence": 0.0,
                "retrieval": 0.0,
                "citation": 0.0,
                "groundedness": 0.0,
                "abstained": False,
            }

        response_lower = response_text.lower()

        if any(marker in response_lower for marker in cls.INSUFFICIENT_MARKERS):
            return {
                "confidence": 1.0,
                "retrieval": 0.0,
                "citation": 0.0,
                "groundedness": 1.0,
                "abstained": True,
            }

        retrieval_score = cls._retrieval_score(retrieved_sources)
        citation_score = cls._citation_score(response_lower, retrieved_sources)
        groundedness_score = await cls._groundedness_score(response_text, retrieved_sources)

        confidence = (
            0.4 * retrieval_score
            + 0.2 * citation_score
            + 0.4 * groundedness_score
        )

        return {
            "confidence": round(confidence, 2),
            "retrieval": round(retrieval_score, 2),
            "citation": round(citation_score, 2),
            "groundedness": round(groundedness_score, 2),
            "abstained": False,
        }

    @staticmethod
    def _retrieval_score(retrieved_sources: List[Dict[str, Any]]) -> float:
        scores = [max(0.0, min(1.0, s.get("score", 0.0))) for s in retrieved_sources]
        avg_similarity = sum(scores) / len(scores)
        top1_similarity = max(scores)
        return 0.5 * top1_similarity + 0.5 * avg_similarity

    @staticmethod
    def _citation_score(
        response_lower: str,
        retrieved_sources: List[Dict[str, Any]],
    ) -> float:
        citations_found = 0
        for source in retrieved_sources:
            article = str(source.get("numero_article", "")).strip()
            if not article:
                continue

            # numero_article contient déjà le mot "Article" (ex: "Article
            # premier", "Article 5") -> on le retire pour ne pas le
            # dupliquer dans le motif de recherche, et on repasse en
            # minuscules puisqu'on compare à response_lower.
            article_number = re.sub(
                r"^article\s+",
                "",
                article.lower(),
            ).strip()

            if not article_number:
                continue

            pattern = rf"\barticle\s+{re.escape(article_number)}\b"

            if re.search(pattern, response_lower):
                citations_found += 1

        return citations_found / len(retrieved_sources)

    @classmethod
    async def _groundedness_score(
        cls,
        response_text: str,
        retrieved_sources: List[Dict[str, Any]],
    ) -> float:
        sentences = [
            s.strip()
            for s in re.split(r"(?<=[.!?])\s+", response_text)
            if len(s.strip()) > cls.MIN_SENTENCE_LENGTH
        ]
        if not sentences:
            return 0.0

        try:
            context_vectors = [
                await EmbeddingService.get_embedding(s.get("contenu_texte", ""))
                for s in retrieved_sources
                if s.get("contenu_texte")
            ]
            sentence_vectors = [
                await EmbeddingService.get_embedding(sent) for sent in sentences
            ]
        except Exception as e:
            logger.warning("Groundedness non calculé [%s]: %s", type(e).__name__, e)
            return 0.5

        if not context_vectors:
            return 0.0

        grounded_count = 0
        for sv in sentence_vectors:
            best_similarity = max(cls._cosine(sv, cv) for cv in context_vectors)
            if best_similarity >= cls.GROUNDEDNESS_THRESHOLD:
                grounded_count += 1

        return grounded_count / len(sentences)

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        a_arr, b_arr = np.array(a), np.array(b)
        denom = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
        return float(np.dot(a_arr, b_arr) / denom) if denom else 0.0