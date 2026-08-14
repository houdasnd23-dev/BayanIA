from typing import List, Dict, Any
import re

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:

    DENSE_TOP_K = 20
    LEXICAL_TOP_K = 30
    FINAL_TOP_K = 10
    RRF_K = 60

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""

        text = text.lower()

        # Diacritiques arabes
        text = re.sub(
            r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]",
            "",
            text,
        )

        # Normalisation arabe
        text = text.replace("أ", "ا")
        text = text.replace("إ", "ا")
        text = text.replace("آ", "ا")
        text = text.replace("ٱ", "ا")
        text = text.replace("ى", "ي")
        text = text.replace("ة", "ه")
        text = text.replace("ـ", "")

        text = re.sub(r"\s+", " ", text).strip()

        return text

    @classmethod
    def extract_terms(cls, query: str) -> List[str]:

        text = cls.normalize_text(query)

        tokens = re.findall(
            r"[\u0600-\u06FF]+|[A-Za-zÀ-ÿ]+|\d+(?:[./-]\d+)*",
            text,
        )

        stopwords = {
            "ما",
            "ماذا",
            "ماهو",
            "ماهي",
            "من",
            "هل",
            "كيف",
            "لماذا",
            "متى",
            "اين",
            "في",
            "عن",
            "على",
            "الى",
            "و",
            "او",
            "مع",
            "هو",
            "هي",
            "هذا",
            "هذه",
            "الذي",
            "التي",
            "حسب",
            "حول",
            "بشأن",
            "بخصوص",
            "quel",
            "quelle",
            "quels",
            "quelles",
            "qui",
            "que",
            "comment",
            "pourquoi",
            "dans",
            "sur",
            "avec",
            "selon",
            "pour",
            "des",
            "les",
            "une",
            "un",
            "de",
            "du",
            "la",
            "le",
            "et",
            "ou",
        }

        tokens = [
            t for t in tokens
            if len(t) >= 3 and t not in stopwords
        ]

        terms = []

        # Expressions de plusieurs mots
        for n in (4, 3, 2):
            for i in range(len(tokens) - n + 1):
                phrase = " ".join(tokens[i:i + n])

                if len(phrase) >= 6 and phrase not in terms:
                    terms.append(phrase)

        # Mots individuels
        for token in tokens:
            if token not in terms:
                terms.append(token)

        return terms[:20]

    @classmethod
    async def lexical_search(
        cls,
        db: AsyncSession,
        query: str,
    ) -> List[Dict[str, Any]]:

        terms = cls.extract_terms(query)

        if not terms:
            return []

        conditions = []

        for term in terms:
            pattern = f"%{term}%"

            conditions.extend([
                SourceJuridique.titre_document.ilike(pattern),
                SourceJuridique.contenu_texte.ilike(pattern),
                SourceJuridique.numero_article.ilike(pattern),
            ])

        stmt = (
            select(SourceJuridique)
            .where(
                SourceJuridique.statut_validite.is_(True),
                or_(*conditions),
            )
            .limit(cls.LEXICAL_TOP_K * 4)
        )

        result = await db.execute(stmt)
        sources = result.scalars().all()

        results = []

        normalized_terms = [
            cls.normalize_text(t)
            for t in terms
        ]

        for source in sources:

            title = cls.normalize_text(
                source.titre_document or ""
            )

            content = cls.normalize_text(
                source.contenu_texte or ""
            )

            article = cls.normalize_text(
                source.numero_article or ""
            )

            score = 0
            matches = 0

            for term in normalized_terms:

                if not term:
                    continue

                if term in title:
                    score += 5
                    matches += 1

                if term in article:
                    score += 4
                    matches += 1

                if term in content:
                    score += 2
                    matches += 1

            if matches == 0:
                continue

            if matches >= 2:
                score += 3

            if matches >= 3:
                score += 3

            results.append({
                "id_source": source.id_source,
                "titre_document": source.titre_document,
                "numero_article": source.numero_article,
                "contenu_texte": source.contenu_texte,
                "type_source": source.type_source,
                "lexical_score": score,
            })

        results.sort(
            key=lambda x: x["lexical_score"],
            reverse=True,
        )

        return results[:cls.LEXICAL_TOP_K]

    @classmethod
    async def dense_search(
        cls,
        query: str,
    ) -> List[Dict[str, Any]]:

        vector = await EmbeddingService.get_embedding(query)

        return await QdrantService.search_similar(
            vector,
            top_k=cls.DENSE_TOP_K,
            min_score=0.35,
        )

    @classmethod
    async def hybrid_search(
        cls,
        db: AsyncSession,
        query: str,
        top_k: int = FINAL_TOP_K,
    ) -> List[Dict[str, Any]]:

        dense_results = await cls.dense_search(query)

        lexical_results = await cls.lexical_search(
            db,
            query,
        )

        merged = {}

        # Dense
        for rank, item in enumerate(dense_results, start=1):

            source_id = item.get("id_source")

            if source_id is None:
                continue

            if source_id not in merged:
                merged[source_id] = {
                    **item,
                    "rrf_score": 0.0,
                    "dense_rank": None,
                    "lexical_rank": None,
                }

            merged[source_id]["rrf_score"] += (
                1 / (cls.RRF_K + rank)
            )

            merged[source_id]["dense_rank"] = rank

        # Lexical
        for rank, item in enumerate(lexical_results, start=1):

            source_id = item.get("id_source")

            if source_id is None:
                continue

            if source_id not in merged:
                merged[source_id] = {
                    **item,
                    "rrf_score": 0.0,
                    "dense_rank": None,
                    "lexical_rank": None,
                }

            merged[source_id]["rrf_score"] += (
                1 / (cls.RRF_K + rank)
            )

            merged[source_id]["lexical_rank"] = rank

        # Bonus si les deux retrievers trouvent le même résultat
        for item in merged.values():

            if (
                item["dense_rank"] is not None
                and item["lexical_rank"] is not None
            ):
                item["rrf_score"] += 0.01

        results = list(merged.values())

        results.sort(
            key=lambda x: x["rrf_score"],
            reverse=True,
        )

        return results[:top_k]