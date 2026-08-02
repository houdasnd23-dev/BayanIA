import json
import logging
from typing import List, Dict, Any, Optional

import anthropic
from anthropic import APIStatusError, APIConnectionError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.core.config import settings
from app.schemas.document_analyse import AnalyseDocumentResponse

logger = logging.getLogger(__name__)


class LLMService:

    SYSTEM_RULES = """Tu es BayanIA, un assistant juridique spécialisé dans le droit marocain.

Tu dois respecter STRICTEMENT les règles suivantes :

1. Réponds uniquement à partir du contexte fourni.
2. N'invente jamais une règle juridique.
3. Si le contexte ne permet pas de répondre, indique clairement que les informations sont insuffisantes.
4. Cite toujours les articles utilisés.
5. Réponds dans la même langue que la question de l'utilisateur:
     - arabe → réponse en arabe
     - français → réponse en français
     - anglais → réponse en anglais
6. Garde les références juridiques dans leur langue d'origine.
7. Structure ta réponse ainsi :

Réponse

Explication

Références juridiques
"""

    # Modèle principal + modèles de secours essayés dans l'ordre si le
    # précédent échoue (surcharge, timeout...).
    MODEL: str = "claude-sonnet-4-5"
    FALLBACK_MODELS: List[str] = [
        "claude-sonnet-4-5",
        "claude-haiku-4-5",
    ]

    # ------------------------------------------------------------------
    # Construction du contexte / prompt (identique à avant, aucun changement)
    # ------------------------------------------------------------------

    @staticmethod
    def _build_context(context_chunks: List[Dict[str, Any]]) -> str:
        if not context_chunks:
            return "Aucun contexte juridique disponible."

        parts = []
        for i, chunk in enumerate(context_chunks, start=1):
            titre = chunk.get("titre_document", "Document")
            article = chunk.get("numero_article", "")
            contenu = chunk.get("contenu_texte", "") or ""

            parts.append(
                f"SOURCE {i}\n\nDocument : {titre}\nArticle : {article}\n\n{contenu}"
            )

        return "\n\n".join(parts)

    @classmethod
    def _build_prompt(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        context = cls._build_context(context_chunks)

        return f"""==========================
CONTEXTE JURIDIQUE
==========================

{context}

==========================
QUESTION
==========================

{anonymized_question}
"""

    # ------------------------------------------------------------------
    # Appel Claude avec retry (backoff exponentiel) sur erreurs transitoires
    # ------------------------------------------------------------------

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(APIConnectionError),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_claude(client: anthropic.AsyncAnthropic, model: str, prompt: str, **kwargs):
        """
        Un seul appel Claude, retenté jusqu'à 3 fois (2s, 4s, 8s) uniquement
        sur les erreurs de connexion transitoires. Les erreurs API (401, 400...)
        remontent immédiatement sans retry.
        """
        return await client.messages.create(
            model=model,
            max_tokens=2000,
            system=LLMService.SYSTEM_RULES,
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )

    @classmethod
    async def _generate_with_fallback(
        cls,
        client: anthropic.AsyncAnthropic,
        prompt: str,
        **kwargs,
    ):
        """
        Essaie le modèle principal puis, en cas d'échec (après les retries
        internes), bascule successivement sur les modèles de secours.
        """
        models_to_try = [cls.MODEL] + [m for m in cls.FALLBACK_MODELS if m != cls.MODEL]

        last_error: Optional[Exception] = None

        for model in models_to_try:
            try:
                logger.info("Tentative Claude avec le modèle: %s", model)
                response = await cls._call_claude(client, model, prompt, **kwargs)
                logger.info("Succès avec le modèle: %s", model)
                return response
            except APIStatusError as e:
                if e.status_code in (401, 400):
                    logger.exception("Erreur client Claude (non transitoire) — abandon")
                    raise
                logger.warning(
                    "Échec avec %s (status %s), passage au modèle suivant",
                    model, e.status_code,
                )
                last_error = e
                continue
            except Exception as e:
                logger.warning(
                    "Échec définitif avec %s après retries, passage au modèle suivant",
                    model,
                )
                last_error = e
                continue

        raise last_error

    # ------------------------------------------------------------------
    # Génération de réponse (chat juridique)
    # ------------------------------------------------------------------

    @classmethod
    async def generate_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        if not settings.ANTHROPIC_API_KEY:
            logger.error("ANTHROPIC_API_KEY manquante — bascule en mode mock.")
            return cls._generate_mock_response(anonymized_question, context_chunks)

        prompt = cls._build_prompt(anonymized_question, context_chunks)

        try:
            logger.info("========== CLAUDE ==========")
            logger.info("Modèle principal: %s", cls.MODEL)
            logger.info("Modèles de secours: %s", cls.FALLBACK_MODELS)
            logger.info("API Key présente: %s", bool(settings.ANTHROPIC_API_KEY))

            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = await cls._generate_with_fallback(client, prompt)

            if response.content and response.content[0].text:
                return response.content[0].text.strip()

            logger.warning("Claude a répondu sans texte.")
            return "Le modèle n'a retourné aucune réponse."

        except Exception:
            logger.exception("Tous les modèles Claude ont échoué — mode mock")
            return cls._generate_mock_response(anonymized_question, context_chunks)

    @classmethod
    def _generate_mock_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        if not context_chunks:
            return (
                "Aucune source juridique pertinente n'a été trouvée "
                "pour répondre à cette question."
            )

        chunk = context_chunks[0]
        contenu: Optional[str] = chunk.get("contenu_texte") or ""
        extrait = contenu[:300]

        return f"""[BayanIA - MODE TEST]

Question :
{anonymized_question}

Document :
{chunk.get("titre_document", "Document")}

Article :
{chunk.get("numero_article", "")}

Extrait :

{extrait}...

Cette réponse est simulée car Claude n'est pas disponible.
"""

    # ------------------------------------------------------------------
    # Analyse de document (contrats, jugements) — sortie JSON structurée
    # ------------------------------------------------------------------

    @classmethod
    async def analyze_document(
        cls,
        document_text: str,
        instructions_utilisateur: str = "",
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> AnalyseDocumentResponse:
        if not settings.ANTHROPIC_API_KEY:
            logger.error("ANTHROPIC_API_KEY manquante — bascule en mode mock.")
            return cls._generate_mock_analysis(document_text)

        context = cls._build_context(context_chunks or [])
        instructions = instructions_utilisateur.strip() or (
            "Analyse ce document juridique : résume les points clés, "
            "identifie les clauses à risque et vérifie sa conformité au droit marocain."
        )

        # Claude n'a pas d'équivalent direct au response_schema de Gemini ->
        # on demande explicitement un JSON conforme au schéma dans le prompt,
        # et on le parse nous-mêmes (comme le fait déjà le code existant).
        schema_json = json.dumps(AnalyseDocumentResponse.model_json_schema(), ensure_ascii=False)

        prompt = f"""Tu es BayanIA, un assistant juridique spécialisé dans le droit marocain.

Analyse le document ci-dessous en respectant STRICTEMENT ces règles :
1. Base-toi uniquement sur le texte du document et le contexte juridique fourni.
2. N'invente jamais une clause ou un article qui n'existe pas dans le document.
3. Si aucune clause à risque n'est identifiée, retourne une liste vide.
4. Réponds en français.
5. Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après,
   conforme exactement à ce schéma JSON :

{schema_json}

==========================
DOCUMENT À ANALYSER
==========================

{document_text}

==========================
CONTEXTE JURIDIQUE (droit marocain pertinent)
==========================

{context}

==========================
INSTRUCTIONS SPÉCIFIQUES
==========================

{instructions}
"""

        try:
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = await cls._generate_with_fallback(client, prompt)

            if response.content and response.content[0].text:
                raw_text = response.content[0].text.strip()
                # au cas où Claude entoure le JSON de ```json ... ``` malgré la consigne
                raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(raw_text)
                return AnalyseDocumentResponse(**data)

            logger.warning("Claude a répondu sans texte pour l'analyse de document.")
            return cls._generate_mock_analysis(document_text)

        except Exception:
            logger.exception("Erreur Claude lors de l'analyse de document")
            return cls._generate_mock_analysis(document_text)

    @classmethod
    def _generate_mock_analysis(cls, document_text: str) -> AnalyseDocumentResponse:
        extrait = document_text[:300]
        return AnalyseDocumentResponse(
            resume=f"[MODE TEST] Analyse simulée car Claude n'est pas disponible. Extrait : {extrait}...",
            clauses_risque=[],
            conformite="Non évalué (mode test — Claude indisponible).",
            recommandations=["Configurez ANTHROPIC_API_KEY pour une analyse réelle."],
        )