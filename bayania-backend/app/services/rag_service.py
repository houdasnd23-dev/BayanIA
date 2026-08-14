from typing import Tuple, List, Dict, Any
import re

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique

from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.llm_service import LLMService
from app.services.confidence_service import ConfidenceService


class RAGService:
    """
    Service RAG hybride pour BayanIA.

    Pipeline :
        Question
          ↓
        Recherche dense Qdrant
          +
        Recherche lexicale PostgreSQL
          ↓
        Fusion RRF
          ↓
        Sélection des meilleurs passages
          ↓
        LLM
          ↓
        Score de confiance

    Cette approche est générique :
    aucun domaine juridique n'est codé en dur.
    """

    # Nombre de candidats récupérés avant fusion
    DENSE_TOP_K = 20
    LEXICAL_TOP_K = 30

    # Nombre de passages envoyés au LLM
    FINAL_TOP_K = 6

    # Paramètre standard de Reciprocal Rank Fusion
    RRF_K = 60

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def _normalize_text(text: str) -> str:
        """
        Normalisation légère arabe/français.

        Important :
        cette normalisation sert uniquement à améliorer la recherche.
        Le texte original reste inchangé dans la réponse.
        """

        if not text:
            return ""

        text = text.lower()

        # Suppression des voyelles / diacritiques arabes
        text = re.sub(
            r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]",
            "",
            text,
        )

        # Normalisation des variantes arabes
        text = text.replace("أ", "ا")
        text = text.replace("إ", "ا")
        text = text.replace("آ", "ا")
        text = text.replace("ٱ", "ا")
        text = text.replace("ى", "ي")
        text = text.replace("ة", "ه")

        # Suppression du tatweel
        text = text.replace("ـ", "")

        # Espaces multiples
        text = re.sub(r"\s+", " ", text).strip()

        return text

    # ==========================================================
    # EXTRACTION GENERIQUE DES TERMES
    # ==========================================================

    @classmethod
    def _extract_search_terms(cls, question: str) -> List[str]:
        """
        Extrait automatiquement des termes importants d'une question.

        On conserve :
          - les expressions de 4 mots
          - les expressions de 3 mots
          - les expressions de 2 mots
          - les mots individuels significatifs

        Aucun domaine juridique n'est codé en dur.
        """

        normalized = cls._normalize_text(question)

        if not normalized:
            return []

        # Arabe + français + chiffres
        tokens = re.findall(
            r"[\u0600-\u06FF]+|[A-Za-zÀ-ÿ]+|\d+(?:[./-]\d+)*",
            normalized,
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
            "أين",
            "في",
            "من",
            "عن",
            "على",
            "الى",
            "إلى",
            "و",
            "او",
            "أو",
            "ثم",
            "مع",
            "هو",
            "هي",
            "هذا",
            "هذه",
            "ذلك",
            "تلك",
            "الذي",
            "التي",
            "الذين",
            "اللاتي",
            "حسب",
            "حول",
            "بشأن",
            "بخصوص",
            "المغرب",
            "المغربية",
            "المتعلقة",
            "المتعلق",
            "بـ",
            "لـ",

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
            "quand",
            "dans",
            "sur",
            "avec",
            "selon",
            "entre",
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
            "ce",
            "ces",
            "cette",
            "est",
            "sont",
        }

        # On élimine les mots trop génériques
        meaningful_tokens = [
            token
            for token in tokens
            if len(token) >= 3 and token not in stopwords
        ]

        terms: List[str] = []

        # ------------------------------------------------------
        # N-grams : expressions de plusieurs mots
        # ------------------------------------------------------

        # On commence par les expressions les plus longues.
        for n in (4, 3, 2):
            for i in range(len(meaningful_tokens) - n + 1):
                phrase = " ".join(meaningful_tokens[i:i + n])

                if len(phrase) >= 6 and phrase not in terms:
                    terms.append(phrase)

        # ------------------------------------------------------
        # Mots individuels
        # ------------------------------------------------------

        for token in meaningful_tokens:
            if token not in terms:
                terms.append(token)

        # Limite pour éviter une requête SQL énorme
        return terms[:20]

    # ==========================================================
    # RECHERCHE LEXICALE
    # ==========================================================

    @classmethod
    async def _lexical_search(
        cls,
        db: AsyncSession,
        question: str,
        limit: int = LEXICAL_TOP_K,
    ) -> List[Dict[str, Any]]:
        """
        Recherche lexicale dans PostgreSQL.

        Recherche dans :
            - titre_document
            - contenu_texte
            - numero_article

        Elle est complémentaire de Qdrant.

        Aucun domaine n'est codé en dur.
        """

        terms = cls._extract_search_terms(question)

        if not terms:
            return []

        # ------------------------------------------------------
        # Construction de la requête
        # ------------------------------------------------------

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
            .limit(limit * 4)
        )

        result = await db.execute(stmt)
        sources = list(result.scalars().all())

        # ------------------------------------------------------
        # Scoring local
        # ------------------------------------------------------

        scored: List[Dict[str, Any]] = []

        normalized_terms = [
            cls._normalize_text(term)
            for term in terms
        ]

        for source in sources:
            title = cls._normalize_text(
                source.titre_document or ""
            )

            content = cls._normalize_text(
                source.contenu_texte or ""
            )

            article = cls._normalize_text(
                source.numero_article or ""
            )

            score = 0.0
            matched_terms = 0

            for term in normalized_terms:
                if not term:
                    continue

                term_score = 0.0

                # Le titre est le signal le plus important
                if term in title:
                    term_score += 5.0

                # Numéro / référence d'article
                if term in article:
                    term_score += 4.0

                # Contenu
                if term in content:
                    term_score += 2.0

                if term_score > 0:
                    matched_terms += 1
                    score += term_score

            # Bonus si plusieurs termes de la question apparaissent
            # dans le même passage.
            if matched_terms >= 2:
                score += 3.0

            if matched_terms >= 3:
                score += 3.0

            if score <= 0:
                continue

            scored.append(
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

        scored.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return scored[:limit]

    # ==========================================================
    # RECHERCHE DENSE
    # ==========================================================

    @classmethod
    async def _dense_search(
        cls,
        question: str,
    ) -> List[Dict[str, Any]]:
        """
        Recherche sémantique dans Qdrant.
        """

        query_vector = await EmbeddingService.get_embedding(
            question
        )

        hits = await QdrantService.search_similar(
            query_vector,
            top_k=cls.DENSE_TOP_K,
            min_score=0.35,
        )

        for hit in hits:
            hit["retrieval_type"] = "dense"

        return hits

    # ==========================================================
    # RECIPROCAL RANK FUSION
    # ==========================================================

    @classmethod
    def _rrf_fusion(
        cls,
        dense_hits: List[Dict[str, Any]],
        lexical_hits: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Fusionne les résultats dense et lexicaux avec RRF.

        RRF = 1 / (k + rang)

        Avantage :
        les scores Qdrant et SQL n'ont pas besoin d'être comparables.
        """

        merged: Dict[int, Dict[str, Any]] = {}

        # ------------------------------------------------------
        # Dense
        # ------------------------------------------------------

        for rank, hit in enumerate(dense_hits, start=1):
            source_id = hit.get("id_source")

            if source_id is None:
                continue

            if source_id not in merged:
                merged[source_id] = {
                    **hit,
                    "rrf_score": 0.0,
                    "dense_rank": None,
                    "lexical_rank": None,
                    "dense_score": 0.0,
                    "lexical_score": 0.0,
                }

            merged[source_id]["rrf_score"] += (
                1.0 / (cls.RRF_K + rank)
            )

            merged[source_id]["dense_rank"] = rank
            merged[source_id]["dense_score"] = float(
                hit.get("score", 0.0)
            )

        # ------------------------------------------------------
        # Lexical
        # ------------------------------------------------------

        for rank, hit in enumerate(lexical_hits, start=1):
            source_id = hit.get("id_source")

            if source_id is None:
                continue

            if source_id not in merged:
                merged[source_id] = {
                    **hit,
                    "rrf_score": 0.0,
                    "dense_rank": None,
                    "lexical_rank": None,
                    "dense_score": 0.0,
                    "lexical_score": 0.0,
                }

            merged[source_id]["rrf_score"] += (
                1.0 / (cls.RRF_K + rank)
            )

            merged[source_id]["lexical_rank"] = rank
            merged[source_id]["lexical_score"] = float(
                hit.get("score", 0.0)
            )

        results = list(merged.values())

        # ------------------------------------------------------
        # Bonus si trouvé par les DEUX méthodes
        # ------------------------------------------------------

        for result in results:
            if (
                result["dense_rank"] is not None
                and result["lexical_rank"] is not None
            ):
                result["rrf_score"] += 0.01

        results.sort(
            key=lambda x: x["rrf_score"],
            reverse=True,
        )

        return results[:cls.FINAL_TOP_K]

    # ==========================================================
    # PIPELINE PRINCIPAL
    # ==========================================================

    @classmethod
    async def process_question(
        cls,
        db: AsyncSession,
        anonymized_question: str,
    ) -> Tuple[str, List[SourceJuridique], float]:
        """
        Pipeline principal BayanIA.
        """

        # ------------------------------------------------------
        # 1. Dense retrieval
        # ------------------------------------------------------

        dense_hits = await cls._dense_search(
            anonymized_question
        )

        # ------------------------------------------------------
        # 2. Lexical retrieval
        # ------------------------------------------------------

        lexical_hits = await cls._lexical_search(
            db,
            anonymized_question,
        )

        # ------------------------------------------------------
        # 3. Fusion
        # ------------------------------------------------------

        rag_hits = cls._rrf_fusion(
            dense_hits,
            lexical_hits,
        )

        # ------------------------------------------------------
        # DEBUG
        # ------------------------------------------------------

        print("\n========== BAYANIA HYBRID RAG ==========")
        print(
            f"Question : {anonymized_question}"
        )
        print(
            f"Dense candidates   : {len(dense_hits)}"
        )
        print(
            f"Lexical candidates : {len(lexical_hits)}"
        )
        print(
            f"Final context      : {len(rag_hits)}"
        )

        for i, hit in enumerate(rag_hits, start=1):
            print(
                f"[{i}] "
                f"id={hit.get('id_source')} | "
                f"rrf={hit.get('rrf_score', 0):.6f} | "
                f"dense_rank={hit.get('dense_rank')} | "
                f"lexical_rank={hit.get('lexical_rank')} | "
                f"title={hit.get('titre_document')} | "
                f"article={hit.get('numero_article')}"
            )

        print("=========================================\n")

        # ------------------------------------------------------
        # 4. Aucun résultat
        # ------------------------------------------------------

        if not rag_hits:
            empty_response = (
                "Désolé, aucune source juridique pertinente "
                "n'a été trouvée dans notre base de données "
                "pour répondre à votre question."
            )

            return empty_response, [], 0.0

        # ------------------------------------------------------
        # 5. LLM
        # ------------------------------------------------------

        response_text = await LLMService.generate_response(
            anonymized_question,
            rag_hits,
        )

        # ------------------------------------------------------
        # 6. Sources PostgreSQL
        # ------------------------------------------------------

        source_ids = [
            hit["id_source"]
            for hit in rag_hits
            if hit.get("id_source") is not None
        ]

        cited_sources: List[SourceJuridique] = []

        if source_ids:
            stmt = select(SourceJuridique).where(
                SourceJuridique.id_source.in_(source_ids)
            )

            result = await db.execute(stmt)

            cited_sources = list(
                result.scalars().all()
            )

        # ------------------------------------------------------
        # 7. Confidence
        # ------------------------------------------------------

        confidence = (
            await ConfidenceService.calculate_score(
                response_text=response_text,
                retrieved_sources=rag_hits,
            )
        )

        return (
            response_text,
            cited_sources,
            confidence["confidence"],
        )