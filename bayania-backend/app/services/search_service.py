from typing import List, Dict, Any
import re

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:
    """
    Recherche juridique hybride :
    - recherche sémantique Qdrant
    - recherche lexicale PostgreSQL
    - fusion RRF
    """

    DENSE_TOP_K = 20
    LEXICAL_TOP_K = 30
    FINAL_TOP_K = 10
    RRF_K = 60

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def normalize(text: str) -> str:
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

        return re.sub(r"\s+", " ", text).strip()

    # ==========================================================
    # EXTRACTION DES TERMES
    # ==========================================================

    @classmethod
    def extract_terms(cls, query: str) -> List[str]:
        text = cls.normalize(query)

        if not text:
            return []

        tokens = re.findall(
            r"[\u0600-\u06FF]+|[A-Za-zÀ-ÿ]+|\d+(?:[./-]\d+)*",
            text,
        )

        stopwords = {
            # Arabe
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
            "ذلك",
            "تلك",
            "الذي",
            "التي",
            "حسب",
            "حول",
            "بشأن",
            "بخصوص",

            # Français
            "quel",
            "quelle",
            "quels",
            "quelles",
            "qui",
            "que",
            "quoi",
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
            "au",
            "aux",
            "par",
        }

        tokens = [
            token
            for token in tokens
            if len(token) >= 3 and token not in stopwords
        ]

        terms: List[str] = []

        # Expressions de 4, 3 et 2 mots
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

    # ==========================================================
    # RECHERCHE LEXICALE
    # ==========================================================

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

            conditions.extend(
                [
                    SourceJuridique.titre_document.ilike(pattern),
                    SourceJuridique.contenu_texte.ilike(pattern),
                    SourceJuridique.numero_article.ilike(pattern),
                ]
            )

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

        results: List[Dict[str, Any]] = []

        normalized_terms = [
            cls.normalize(term)
            for term in terms
        ]

        # Expressions exactes de plusieurs mots
        phrase_terms = [
            term
            for term in normalized_terms
            if " " in term
        ]

        # Mots individuels
        single_terms = [
            term
            for term in normalized_terms
            if " " not in term
        ]

        for source in sources:

            title = cls.normalize(
                source.titre_document or ""
            )

            content = cls.normalize(
                source.contenu_texte or ""
            )

            article = cls.normalize(
                source.numero_article or ""
            )

            score = 0.0
            matched_single_terms = 0

            # --------------------------------------------------
            # 1. Expressions exactes
            # --------------------------------------------------

            exact_phrase_found = False

            for phrase in phrase_terms:

                if not phrase:
                    continue

                # Très forte priorité au titre
                if phrase in title:
                    score += 20.0
                    exact_phrase_found = True

                # Forte priorité au contenu
                if phrase in content:
                    score += 12.0
                    exact_phrase_found = True

                # Référence/article
                if phrase in article:
                    score += 10.0
                    exact_phrase_found = True

            # --------------------------------------------------
            # 2. Mots individuels
            # --------------------------------------------------

            for term in single_terms:

                if not term:
                    continue

                found = False

                if term in title:
                    score += 4.0
                    found = True

                if term in article:
                    score += 3.0
                    found = True

                if term in content:
                    score += 1.0
                    found = True

                if found:
                    matched_single_terms += 1

            # --------------------------------------------------
            # 3. Bonus si plusieurs termes sont présents
            # --------------------------------------------------

            if matched_single_terms >= 2:
                score += 8.0

            if matched_single_terms >= 3:
                score += 8.0

            # --------------------------------------------------
            # 4. Bonus expression exacte
            # --------------------------------------------------

            if exact_phrase_found:
                score += 15.0

            # --------------------------------------------------
            # 5. Filtrer les résultats trop faibles
            # --------------------------------------------------

            if score < 5.0:
                continue

            results.append(
                {
                    "id_source": source.id_source,
                    "titre_document": source.titre_document,
                    "numero_article": source.numero_article,
                    "contenu_texte": source.contenu_texte,
                    "type_source": source.type_source,
                    "score": score,
                    "retrieval_type": "lexical",
                }
            )

        results.sort(
            key=lambda x: x["score"],
            reverse=True,
        )

        return results[:cls.LEXICAL_TOP_K]

    # ==========================================================
    # RECHERCHE DENSE
    # ==========================================================

    @classmethod
    async def dense_search(
        cls,
        query: str,
    ) -> List[Dict[str, Any]]:

        vector = await EmbeddingService.get_embedding(query)

        results = await QdrantService.search_similar(
            vector,
            top_k=cls.DENSE_TOP_K,
            min_score=0.35,
        )

        return results

    # ==========================================================
    # FUSION RRF
    # ==========================================================

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

        merged: Dict[int, Dict[str, Any]] = {}

        # ------------------------------------------------------
        # Résultats dense
        # ------------------------------------------------------

        for rank, item in enumerate(
            dense_results,
            start=1,
        ):

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
                1.0 / (cls.RRF_K + rank)
            )

            merged[source_id]["dense_rank"] = rank

        # ------------------------------------------------------
        # Résultats lexicaux
        # ------------------------------------------------------

        for rank, item in enumerate(
            lexical_results,
            start=1,
        ):

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
                1.0 / (cls.RRF_K + rank)
            )

            merged[source_id]["lexical_rank"] = rank

        # ------------------------------------------------------
        # Bonus lorsque les 2 méthodes trouvent le même document
        # ------------------------------------------------------

        for item in merged.values():

            if (
                item["dense_rank"] is not None
                and item["lexical_rank"] is not None
            ):
                item["rrf_score"] += 0.01

        results = list(merged.values())

        # ------------------------------------------------------
        # Tri
        # ------------------------------------------------------

        results.sort(
            key=lambda x: x["rrf_score"],
            reverse=True,
        )

        # ------------------------------------------------------
        # Normalisation du score pour le frontend
        # 0.0 → 1.0
        # ------------------------------------------------------

        if results:

            max_score = results[0]["rrf_score"]

            for item in results:

                if max_score > 0:
                    item["score"] = (
                        item["rrf_score"] / max_score
                    )
                else:
                    item["score"] = 0.0

        return results[:top_k]