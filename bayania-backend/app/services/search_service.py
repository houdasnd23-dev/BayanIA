from typing import List, Dict, Any
import re

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:
    """
    Recherche juridique hybride BayanIA.

    Dense:
        Qdrant -> similarité sémantique

    Lexical:
        PostgreSQL -> correspondance exacte des termes

    Les deux résultats sont ensuite fusionnés.
    """

    DENSE_TOP_K = 20
    LEXICAL_TOP_K = 30
    FINAL_TOP_K = 10

    # ==========================================================
    # NORMALISATION POUR LE SCORING UNIQUEMENT
    # ==========================================================

    @staticmethod
    def normalize_for_score(text: str) -> str:
        """
        Normalisation utilisée UNIQUEMENT pour comparer les textes.

        Attention :
        ne pas utiliser cette fonction pour construire les requêtes SQL,
        sinon certaines lettres arabes changent (ة -> ه, etc.).
        """

        if not text:
            return ""

        text = text.lower()

        text = re.sub(
            r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]",
            "",
            text,
        )

        text = text.replace("أ", "ا")
        text = text.replace("إ", "ا")
        text = text.replace("آ", "ا")
        text = text.replace("ٱ", "ا")
        text = text.replace("ى", "ي")
        text = text.replace("ة", "ه")
        text = text.replace("ـ", "")

        return re.sub(r"\s+", " ", text).strip()

    # ==========================================================
    # TEXTE POUR REQUETE SQL
    # ==========================================================

    @staticmethod
    def normalize_for_sql(text: str) -> str:
        """
        Normalisation légère pour PostgreSQL.

        IMPORTANT :
        on ne modifie PAS les lettres arabes.
        """

        if not text:
            return ""

        text = text.lower()

        return re.sub(r"\s+", " ", text).strip()

    # ==========================================================
    # EXTRACTION DES TERMES
    # ==========================================================

    @classmethod
    def extract_terms(cls, query: str) -> List[str]:
        """
        Extrait :
        - expressions de 4 mots
        - expressions de 3 mots
        - expressions de 2 mots
        - mots individuels

        Les termes retournés conservent leur forme pour SQL.
        """

        text = cls.normalize_for_sql(query)

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

        # Expressions composées
        for n in (4, 3, 2):
            for i in range(len(tokens) - n + 1):

                phrase = " ".join(
                    tokens[i:i + n]
                )

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

        # IMPORTANT :
        # ici on utilise les termes BRUTS,
        # pas normalize_for_score().
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

        sources = list(
            result.scalars().all()
        )

        results = []

        # Expressions composées
        phrase_terms = [
            term
            for term in terms
            if " " in term
        ]

        # Mots seuls
        single_terms = [
            term
            for term in terms
            if " " not in term
        ]

        normalized_phrases = [
            cls.normalize_for_score(term)
            for term in phrase_terms
        ]

        normalized_single_terms = [
            cls.normalize_for_score(term)
            for term in single_terms
        ]

        # ------------------------------------------------------
        # Scoring
        # ------------------------------------------------------

        for source in sources:

            title_raw = source.titre_document or ""
            content_raw = source.contenu_texte or ""
            article_raw = source.numero_article or ""

            title = cls.normalize_for_score(
                title_raw
            )

            content = cls.normalize_for_score(
                content_raw
            )

            article = cls.normalize_for_score(
                article_raw
            )

            score = 0.0

            exact_phrase_count = 0
            matched_single_terms = 0

            # --------------------------------------------------
            # Expressions exactes
            # --------------------------------------------------

            for phrase in normalized_phrases:

                if not phrase:
                    continue

                if phrase in title:
                    score += 30.0
                    exact_phrase_count += 1

                elif phrase in content:
                    score += 20.0
                    exact_phrase_count += 1

                elif phrase in article:
                    score += 15.0
                    exact_phrase_count += 1

            # --------------------------------------------------
            # Termes individuels
            # --------------------------------------------------

            for term in normalized_single_terms:

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
            # Bonus plusieurs termes
            # --------------------------------------------------

            if matched_single_terms >= 2:
                score += 10.0

            if matched_single_terms >= 3:
                score += 10.0

            # --------------------------------------------------
            # Bonus très fort si phrase exacte
            # --------------------------------------------------

            if exact_phrase_count > 0:
                score += 30.0

            if score <= 0:
                continue

            results.append(
                {
                    "id_source": source.id_source,
                    "titre_document": source.titre_document,
                    "numero_article": source.numero_article,
                    "contenu_texte": source.contenu_texte,
                    "type_source": source.type_source,
                    "score": score,
                    "exact_phrase": exact_phrase_count > 0,
                    "retrieval_type": "lexical",
                }
            )

        results.sort(
            key=lambda item: (
                item["exact_phrase"],
                item["score"],
            ),
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

        vector = await EmbeddingService.get_embedding(
            query
        )

        results = await QdrantService.search_similar(
            vector,
            top_k=cls.DENSE_TOP_K,
            min_score=0.35,
        )

        return results

    # ==========================================================
    # RECHERCHE HYBRIDE
    # ==========================================================

    @classmethod
    async def hybrid_search(
        cls,
        db: AsyncSession,
        query: str,
        top_k: int = FINAL_TOP_K,
    ) -> List[Dict[str, Any]]:

        dense_results = await cls.dense_search(
            query
        )

        lexical_results = await cls.lexical_search(
            db,
            query,
        )

        merged: Dict[int, Dict[str, Any]] = {}

        # ------------------------------------------------------
        # Résultats lexicaux
        # ------------------------------------------------------

        for rank, item in enumerate(
            lexical_results,
            start=1,
        ):

            source_id = item.get(
                "id_source"
            )

            if source_id is None:
                continue

            merged[source_id] = {
                **item,
                "lexical_rank": rank,
                "dense_rank": None,
                "dense_score": 0.0,
                "hybrid_score": 0.0,
            }

        # ------------------------------------------------------
        # Résultats dense
        # ------------------------------------------------------

        for rank, item in enumerate(
            dense_results,
            start=1,
        ):

            source_id = item.get(
                "id_source"
            )

            if source_id is None:
                continue

            if source_id not in merged:

                merged[source_id] = {
                    **item,
                    "lexical_rank": None,
                    "dense_rank": rank,
                    "dense_score": float(
                        item.get("score", 0.0)
                    ),
                    "hybrid_score": 0.0,
                }

            else:

                merged[source_id]["dense_rank"] = rank

                merged[source_id][
                    "dense_score"
                ] = float(
                    item.get("score", 0.0)
                )

        # ------------------------------------------------------
        # Calcul du score hybride
        # ------------------------------------------------------

        max_lexical = max(
            (
                float(
                    item.get("score", 0.0)
                )
                for item in lexical_results
            ),
            default=1.0,
        )

        for item in merged.values():

            lexical_score = float(
                item.get("score", 0.0)
            )

            if item.get("retrieval_type") == "dense":
                lexical_score = 0.0

            if max_lexical > 0:
                lexical_normalized = (
                    lexical_score / max_lexical
                )
            else:
                lexical_normalized = 0.0

            dense_score = float(
                item.get("dense_score", 0.0)
            )

            # Score hybride
            hybrid_score = (
                0.65 * lexical_normalized
                + 0.35 * dense_score
            )

            # Très gros bonus pour une expression exacte
            if item.get("exact_phrase"):
                hybrid_score += 0.35

            # Bonus si les deux méthodes trouvent le passage
            if (
                item.get("lexical_rank") is not None
                and item.get("dense_rank") is not None
            ):
                hybrid_score += 0.10

            item["hybrid_score"] = hybrid_score

        results = list(
            merged.values()
        )

        # ------------------------------------------------------
        # Tri
        # ------------------------------------------------------

        results.sort(
            key=lambda item: item[
                "hybrid_score"
            ],
            reverse=True,
        )

        # ------------------------------------------------------
        # Score affiché entre 0 et 1
        # ------------------------------------------------------

        for item in results:

            item["score"] = min(
                item["hybrid_score"],
                1.0,
            )

        # ------------------------------------------------------
        # DEBUG
        # ------------------------------------------------------

        print("\n========== SEARCH HYBRID ==========")
        print(f"Query: {query}")

        for index, item in enumerate(
            results[:top_k],
            start=1,
        ):
            print(
                f"[{index}] "
                f"id={item.get('id_source')} | "
                f"score={item.get('score', 0):.3f} | "
                f"exact={item.get('exact_phrase')} | "
                f"dense_rank={item.get('dense_rank')} | "
                f"lexical_rank={item.get('lexical_rank')} | "
                f"title={item.get('titre_document')}"
            )

        print("===================================\n")

        return results[:top_k]