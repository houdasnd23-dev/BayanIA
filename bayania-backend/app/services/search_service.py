from typing import List, Dict, Any
import re

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:
    """
    Recherche juridique hybride BayanIA.

    Pipeline :
        1. Recherche exacte PostgreSQL
        2. Recherche lexicale PostgreSQL
        3. Recherche sémantique Qdrant
        4. Fusion
        5. Ranking
        6. Déduplication

    Principe :
        - Les correspondances réellement pertinentes sont prioritaires.
        - Un simple mot commun ne doit pas battre une expression juridique précise.
        - La recherche sémantique sert à compléter et départager.
    """

    DENSE_TOP_K = 30
    LEXICAL_TOP_K = 50
    EXACT_TOP_K = 50
    FINAL_TOP_K = 10

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def normalize_for_score(text: str) -> str:
        """
        Normalisation utilisée uniquement pour comparer les textes.
        """

        if not text:
            return ""

        text = text.lower()

        # Diacritiques arabes
        text = re.sub(
            r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]",
            "",
            text,
        )

        # Variantes arabes
        text = text.replace("أ", "ا")
        text = text.replace("إ", "ا")
        text = text.replace("آ", "ا")
        text = text.replace("ٱ", "ا")
        text = text.replace("ى", "ي")
        text = text.replace("ة", "ه")
        text = text.replace("ـ", "")

        # Espaces
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    @staticmethod
    def normalize_for_sql(text: str) -> str:
        """
        Normalisation légère pour PostgreSQL.
        On conserve les lettres arabes.
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

        text = cls.normalize_for_sql(query)

        if not text:
            return []

        tokens = re.findall(
            r"[\u0600-\u06FF]+|[A-Za-zÀ-ÿ]+|\d+(?:[./-]\d+)*",
            text,
        )

        stopwords = {
            # =========================
            # Arabe
            # =========================
            "ما",
            "ماذا",
            "ماهو",
            "ماهي",
            "ماهى",
            "من",
            "هل",
            "كيف",
            "لماذا",
            "متى",
            "اين",
            "أين",
            "في",
            "عن",
            "على",
            "الى",
            "إلى",
            "و",
            "او",
            "أو",
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
            "منه",
            "منها",
            "ماهو",
            "ماهي",

            # =========================
            # Français
            # =========================
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
            "est",
            "sont",
            "sous",
            "dans",
        }

        tokens = [
            token
            for token in tokens
            if len(token) >= 3 and token not in stopwords
        ]

        if not tokens:
            return []

        terms: List[str] = []

        # Expressions composées
        for n in (4, 3, 2):
            for i in range(len(tokens) - n + 1):

                phrase = " ".join(tokens[i:i + n])

                if len(phrase) >= 6 and phrase not in terms:
                    terms.append(phrase)

        # Mots individuels
        for token in tokens:
            if token not in terms:
                terms.append(token)

        return terms[:25]

    # ==========================================================
    # RECHERCHE EXACTE
    # ==========================================================

    @classmethod
    async def exact_search(
        cls,
        db: AsyncSession,
        query: str,
    ) -> List[Dict[str, Any]]:

        query_sql = cls.normalize_for_sql(query)

        if not query_sql:
            return []

        normalized_query = cls.normalize_for_score(query_sql)

        # Normalisation des espaces côté PostgreSQL
        normalized_content = func.regexp_replace(
            SourceJuridique.contenu_texte,
            r"[[:space:]]+",
            " ",
            "g",
        )

        normalized_title = func.regexp_replace(
            SourceJuridique.titre_document,
            r"[[:space:]]+",
            " ",
            "g",
        )

        normalized_article = func.regexp_replace(
            SourceJuridique.numero_article,
            r"[[:space:]]+",
            " ",
            "g",
        )

        pattern = f"%{query_sql}%"

        stmt = (
            select(SourceJuridique)
            .where(
                SourceJuridique.statut_validite.is_(True),
                or_(
                    normalized_content.ilike(pattern),
                    normalized_title.ilike(pattern),
                    normalized_article.ilike(pattern),
                ),
            )
            .limit(300)
        )

        result = await db.execute(stmt)

        sources = result.scalars().all()

        results: List[Dict[str, Any]] = []

        for source in sources:

            title = cls.normalize_for_score(
                source.titre_document or ""
            )

            article = cls.normalize_for_score(
                source.numero_article or ""
            )

            content = cls.normalize_for_score(
                source.contenu_texte or ""
            )

            # ============================
            # Score textuel
            # ============================

            score = 0.0

            in_title = normalized_query in title
            in_article = normalized_query in article
            in_content = normalized_query in content

            occurrence_count = (
                content.count(normalized_query)
                if in_content
                else 0
            )

            # Expression dans le titre
            if in_title:
                score += 100.0

            # Expression dans l'article
            if in_article:
                score += 90.0

            # Expression dans le contenu
            if in_content:
                score += 55.0

                # Bonus occurrences
                score += min(
                    occurrence_count * 5.0,
                    25.0,
                )

            # Si l'expression n'apparaît qu'une seule fois
            # dans le contenu, sans être dans titre/article,
            # il peut s'agir d'une simple référence.
            if (
                in_content
                and not in_title
                and not in_article
                and occurrence_count == 1
            ):
                score -= 15.0

            # ============================
            # Couverture des termes
            # ============================

            terms = cls.extract_terms(query)

            matched_terms = 0

            for term in terms:

                normalized_term = cls.normalize_for_score(
                    term
                )

                if not normalized_term:
                    continue

                if (
                    normalized_term in title
                    or normalized_term in article
                    or normalized_term in content
                ):
                    matched_terms += 1

            if terms:
                coverage = matched_terms / len(terms)
                score += coverage * 25.0

            # Ne conserver que les vrais matchs
            if score < 50:
                continue

            results.append(
                {
                    "id_source": source.id_source,
                    "titre_document": source.titre_document,
                    "numero_article": source.numero_article,
                    "contenu_texte": source.contenu_texte,
                    "type_source": source.type_source,
                    "score": score,
                    "exact_score": score,
                    "exact_phrase": True,
                    "retrieval_type": "exact",
                }
            )

        # ============================
        # Tri textuel
        # ============================

        results.sort(
            key=lambda item: item.get(
                "exact_score",
                0.0,
            ),
            reverse=True,
        )

        return results[:cls.EXACT_TOP_K]

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
                    SourceJuridique.titre_document.ilike(
                        pattern
                    ),
                    SourceJuridique.contenu_texte.ilike(
                        pattern
                    ),
                    SourceJuridique.numero_article.ilike(
                        pattern
                    ),
                ]
            )

        stmt = (
            select(SourceJuridique)
            .where(
                SourceJuridique.statut_validite.is_(True),
                or_(*conditions),
            )
            .limit(cls.LEXICAL_TOP_K * 5)
        )

        result = await db.execute(stmt)

        sources = result.scalars().all()

        results: List[Dict[str, Any]] = []

        phrase_terms = [
            term
            for term in terms
            if " " in term
        ]

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

        for source in sources:

            title = cls.normalize_for_score(
                source.titre_document or ""
            )

            content = cls.normalize_for_score(
                source.contenu_texte or ""
            )

            article = cls.normalize_for_score(
                source.numero_article or ""
            )

            score = 0.0

            exact_phrase_count = 0
            matched_single_terms = 0

            # ============================
            # Expressions
            # ============================

            for phrase in normalized_phrases:

                if not phrase:
                    continue

                if phrase in title:
                    score += 35.0
                    exact_phrase_count += 1

                elif phrase in article:
                    score += 30.0
                    exact_phrase_count += 1

                elif phrase in content:
                    score += 20.0
                    exact_phrase_count += 1

            # ============================
            # Termes individuels
            # ============================

            for term in normalized_single_terms:

                if not term:
                    continue

                found = False

                if term in title:
                    score += 7.0
                    found = True

                if term in article:
                    score += 5.0
                    found = True

                if term in content:
                    score += 1.5
                    found = True

                if found:
                    matched_single_terms += 1

            # ============================
            # Couverture
            # ============================

            if matched_single_terms >= 2:
                score += 10.0

            if matched_single_terms >= 3:
                score += 10.0

            # ============================
            # Expression exacte
            # ============================

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
                    "exact_phrase": (
                        exact_phrase_count > 0
                    ),
                    "retrieval_type": "lexical",
                }
            )

        results.sort(
            key=lambda item: (
                item.get("exact_phrase", False),
                item.get("score", 0.0),
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

        # ======================================================
        # 1. Recherche exacte
        # ======================================================

        exact_results = await cls.exact_search(
            db,
            query,
        )

        # ======================================================
        # 2. Recherche lexicale
        # ======================================================

        lexical_results = await cls.lexical_search(
            db,
            query,
        )

        # ======================================================
        # 3. Recherche sémantique
        # ======================================================

        dense_results = await cls.dense_search(
            query,
        )

        # ======================================================
        # Indexation
        # ======================================================

        exact_by_id = {
            item["id_source"]: item
            for item in exact_results
            if item.get("id_source") is not None
        }

        lexical_by_id = {
            item["id_source"]: item
            for item in lexical_results
            if item.get("id_source") is not None
        }

        dense_by_id = {
            item["id_source"]: item
            for item in dense_results
            if item.get("id_source") is not None
        }

        # ======================================================
        # Fusion
        # ======================================================

        all_ids = (
            set(exact_by_id.keys())
            | set(lexical_by_id.keys())
            | set(dense_by_id.keys())
        )

        ranked_results: List[Dict[str, Any]] = []

        max_lexical_score = max(
            (
                float(item.get("score", 0.0))
                for item in lexical_results
            ),
            default=1.0,
        )

        max_exact_score = max(
            (
                float(item.get("exact_score", 0.0))
                for item in exact_results
            ),
            default=1.0,
        )

        for source_id in all_ids:

            exact_item = exact_by_id.get(
                source_id
            )

            lexical_item = lexical_by_id.get(
                source_id
            )

            dense_item = dense_by_id.get(
                source_id
            )

            base_item = (
                exact_item
                or lexical_item
                or dense_item
            )

            if not base_item:
                continue

            item = dict(base_item)

            # ==================================================
            # Scores
            # ==================================================

            dense_score = 0.0

            if dense_item:
                dense_score = min(
                    max(
                        float(
                            dense_item.get(
                                "score",
                                0.0,
                            )
                        ),
                        0.0,
                    ),
                    1.0,
                )

            lexical_score = 0.0

            if lexical_item:
                lexical_score = float(
                    lexical_item.get(
                        "score",
                        0.0,
                    )
                )

            lexical_normalized = (
                lexical_score / max_lexical_score
                if max_lexical_score > 0
                else 0.0
            )

            exact_score = 0.0

            if exact_item:
                exact_score = float(
                    exact_item.get(
                        "exact_score",
                        0.0,
                    )
                )

            exact_normalized = (
                exact_score / max_exact_score
                if max_exact_score > 0
                else 0.0
            )

            # ==================================================
            # 1. EXACT
            # ==================================================

            if exact_item:

                # L'exactitude textuelle est prioritaire.
                #
                # Qdrant intervient seulement pour départager
                # deux documents qui contiennent réellement
                # la requête.

                final_score = (
                    0.85 * exact_normalized
                    + 0.15 * dense_score
                )

                item["search_type"] = (
                    "exact_hybrid"
                    if dense_item
                    else "exact"
                )

            # ==================================================
            # 2. LEXICAL + DENSE
            # ==================================================

            elif lexical_item and dense_item:

                final_score = (
                    0.55 * dense_score
                    + 0.45 * lexical_normalized
                )

                item["search_type"] = "hybrid"

            # ==================================================
            # 3. LEXICAL SEUL
            # ==================================================

            elif lexical_item:

                final_score = (
                    0.80 * lexical_normalized
                )

                item["search_type"] = "lexical"

            # ==================================================
            # 4. DENSE SEUL
            # ==================================================

            else:

                final_score = (
                    0.50 * dense_score
                )

                item["search_type"] = "semantic"

            item["score"] = min(
                max(final_score, 0.0),
                1.0,
            )

            ranked_results.append(item)

        # ======================================================
        # TRI
        # ======================================================

        ranked_results.sort(
            key=lambda item: (
                item.get("score", 0.0),
                item.get("exact_score", 0.0),
            ),
            reverse=True,
        )

        # ======================================================
        # DEDUPLICATION
        # ======================================================

        unique_results: List[Dict[str, Any]] = []

        seen_titles = set()

        for item in ranked_results:

            title = (
                item.get("titre_document")
                or f"source_{item.get('id_source')}"
            )

            # Normalisation du titre pour éviter
            # les doublons évidents.
            normalized_title = (
                cls.normalize_for_score(title)
            )

            if normalized_title in seen_titles:
                continue

            seen_titles.add(
                normalized_title
            )

            unique_results.append(item)

            if len(unique_results) >= top_k:
                break

        return unique_results

    # ==========================================================
    # ALIAS
    # ==========================================================

    @classmethod
    async def search(
        cls,
        db: AsyncSession,
        query: str,
        top_k: int = FINAL_TOP_K,
    ) -> List[Dict[str, Any]]:

        return await cls.hybrid_search(
            db=db,
            query=query,
            top_k=top_k,
        )