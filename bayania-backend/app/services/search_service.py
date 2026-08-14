from typing import List, Dict, Any
import re

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source_juridique import SourceJuridique
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:
    """
    Service de recherche juridique hybride BayanIA.

    Pipeline :
        1. Recherche exacte PostgreSQL
        2. Recherche lexicale PostgreSQL
        3. Recherche sémantique Qdrant
        4. Fusion des résultats
        5. Ranking
        6. Déduplication par document
    """

    DENSE_TOP_K = 30
    LEXICAL_TOP_K = 50
    EXACT_TOP_K = 30
    FINAL_TOP_K = 10

    # ==========================================================
    # NORMALISATION POUR LE SCORING
    # ==========================================================

    @staticmethod
    def normalize_for_score(text: str) -> str:
        """
        Normalisation utilisée uniquement pour comparer les textes.

        On normalise certaines variantes arabes pour améliorer
        la comparaison locale.
        """

        if not text:
            return ""

        text = text.lower()

        # Suppression des diacritiques arabes
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

        # Espaces multiples
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    # ==========================================================
    # NORMALISATION POUR SQL
    # ==========================================================

    @staticmethod
    def normalize_for_sql(text: str) -> str:
        """
        Normalisation légère pour construire les requêtes SQL.

        IMPORTANT :
        On ne modifie pas les lettres arabes.
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
        """

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
            "ماهي",
            "ماهى",

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
        """
        Recherche exacte de l'expression complète.

        Cette recherche est prioritaire pour les requêtes juridiques
        courtes et précises comme :
            "مجلس المنافسة"
            "التركيز الاقتصادي"
            "مدونة الشغل"
        """

        query = cls.normalize_for_sql(query)

        if not query:
            return []

        # Expressions SQL insensibles aux majuscules/minuscules.
        #
        # regexp_replace permet de normaliser les espaces provenant
        # notamment de l'OCR.
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

        pattern = f"%{query}%"

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
            .limit(cls.EXACT_TOP_K)
        )

        result = await db.execute(stmt)

        sources = result.scalars().all()

        results: List[Dict[str, Any]] = []

        for source in sources:

            results.append(
                {
                    "id_source": source.id_source,
                    "titre_document": source.titre_document,
                    "numero_article": source.numero_article,
                    "contenu_texte": source.contenu_texte,
                    "type_source": source.type_source,
                    "score": 1.0,
                    "exact_phrase": True,
                    "retrieval_type": "exact",
                }
            )

        return results

    # ==========================================================
    # RECHERCHE LEXICALE
    # ==========================================================

    @classmethod
    async def lexical_search(
        cls,
        db: AsyncSession,
        query: str,
    ) -> List[Dict[str, Any]]:
        """
        Recherche PostgreSQL basée sur les termes importants.
        """

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

        # ======================================================
        # Scoring
        # ======================================================

        for source in sources:

            title_raw = source.titre_document or ""
            content_raw = source.contenu_texte or ""
            article_raw = source.numero_article or ""

            title = cls.normalize_for_score(title_raw)
            content = cls.normalize_for_score(content_raw)
            article = cls.normalize_for_score(article_raw)

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

                elif phrase in article:

                    score += 20.0
                    exact_phrase_count += 1

                elif phrase in content:

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

                    score += 6.0
                    found = True

                if term in article:

                    score += 4.0
                    found = True

                if term in content:

                    score += 1.5
                    found = True

                if found:
                    matched_single_terms += 1

            # --------------------------------------------------
            # Bonus plusieurs termes
            # --------------------------------------------------

            if matched_single_terms >= 2:
                score += 8.0

            if matched_single_terms >= 3:
                score += 8.0

            # --------------------------------------------------
            # Bonus très fort pour phrase exacte
            # --------------------------------------------------

            if exact_phrase_count > 0:
                score += 25.0

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
        """
        Recherche sémantique dans Qdrant.
        """

        vector = await EmbeddingService.get_embedding(query)

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
        """
        Recherche hybride finale.

        Priorité :

        1. Correspondance exacte + bonne similarité sémantique
        2. Correspondance exacte
        3. Lexical + dense
        4. Sémantique seule
        """

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
        # 3. Recherche dense
        # ======================================================

        dense_results = await cls.dense_search(
            query,
        )

        # ======================================================
        # Index Qdrant par id
        # ======================================================

        dense_by_id = {
            item.get("id_source"): item
            for item in dense_results
            if item.get("id_source") is not None
        }

        # ======================================================
        # Index exact par id
        # ======================================================

        exact_by_id = {
            item.get("id_source"): item
            for item in exact_results
            if item.get("id_source") is not None
        }

        # ======================================================
        # Index lexical par id
        # ======================================================

        lexical_by_id = {
            item.get("id_source"): item
            for item in lexical_results
            if item.get("id_source") is not None
        }

        # ======================================================
        # Fusion
        # ======================================================

        all_ids = set()

        all_ids.update(exact_by_id.keys())
        all_ids.update(lexical_by_id.keys())
        all_ids.update(dense_by_id.keys())

        ranked_results: List[Dict[str, Any]] = []

        for source_id in all_ids:

            exact_item = exact_by_id.get(source_id)
            lexical_item = lexical_by_id.get(source_id)
            dense_item = dense_by_id.get(source_id)

            # --------------------------------------------------
            # Base item
            # --------------------------------------------------

            base_item = (
                exact_item
                or lexical_item
                or dense_item
            )

            if not base_item:
                continue

            item = dict(base_item)

            # --------------------------------------------------
            # Scores
            # --------------------------------------------------

            dense_score = 0.0

            if dense_item:

                dense_score = float(
                    dense_item.get("score", 0.0)
                )

            lexical_score = 0.0

            if lexical_item:

                lexical_score = float(
                    lexical_item.get("score", 0.0)
                )

            # Normalisation lexicale
            lexical_normalized = min(
                lexical_score / 100.0,
                1.0,
            )

            # --------------------------------------------------
            # 1. EXACT MATCH
            # --------------------------------------------------

            if exact_item:

                # Le match exact est très important,
                # mais Qdrant départage les documents.
                final_score = (
                    0.70
                    + (0.30 * dense_score)
                )

                item["search_type"] = "exact_hybrid"

            # --------------------------------------------------
            # 2. LEXICAL + DENSE
            # --------------------------------------------------

            elif lexical_item and dense_item:

                final_score = (
                    0.60 * dense_score
                    + 0.40 * lexical_normalized
                )

                item["search_type"] = "hybrid"

            # --------------------------------------------------
            # 3. LEXICAL SEUL
            # --------------------------------------------------

            elif lexical_item:

                final_score = (
                    0.55 * lexical_normalized
                )

                item["search_type"] = "lexical"

            # --------------------------------------------------
            # 4. DENSE SEUL
            # --------------------------------------------------

            else:

                final_score = (
                    0.45 * dense_score
                )

                item["search_type"] = "semantic"

            item["score"] = min(
                max(final_score, 0.0),
                1.0,
            )

            ranked_results.append(item)

        # ======================================================
        # Tri
        # ======================================================

        ranked_results.sort(
            key=lambda item: item.get(
                "score",
                0.0,
            ),
            reverse=True,
        )

        # ======================================================
        # Déduplication par titre de document
        # ======================================================

        unique_results: List[Dict[str, Any]] = []

        seen_titles = set()

        for item in ranked_results:

            title = (
                item.get("titre_document")
                or f"source_{item.get('id_source')}"
            )

            if title in seen_titles:
                continue

            seen_titles.add(title)

            unique_results.append(item)

            if len(unique_results) >= top_k:
                break

        return unique_results

    # ==========================================================
    # ALIAS EVENTUEL
    # ==========================================================

    @classmethod
    async def search(
        cls,
        db: AsyncSession,
        query: str,
        top_k: int = FINAL_TOP_K,
    ) -> List[Dict[str, Any]]:
        """
        Alias pratique pour utiliser SearchService.search(...)
        """

        return await cls.hybrid_search(
            db=db,
            query=query,
            top_k=top_k,
        )