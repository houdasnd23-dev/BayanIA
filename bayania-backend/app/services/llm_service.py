import logging
from typing import List, Dict, Any, Optional

from google import genai
from google.genai.errors import ServerError, ClientError
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
    MODEL: str = "gemini-3.6-flash"
    FALLBACK_MODELS: List[str] = [
      "gemini-3.5-flash",
      "gemini-3.0-flash",
    ]
   

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

        return f"""{cls.SYSTEM_RULES}

==========================
CONTEXTE JURIDIQUE
==========================

{context}

==========================
QUESTION
==========================

{anonymized_question}
"""

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(ServerError),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_gemini(client: genai.Client, model: str, prompt: str, **kwargs):
        return await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            **kwargs,
        )

    @classmethod
    async def _generate_with_fallback(
        cls,
        client: genai.Client,
        prompt: str,
        **kwargs,
    ):
        models_to_try = [cls.MODEL] + [m for m in cls.FALLBACK_MODELS if m != cls.MODEL]
        last_error: Optional[Exception] = None

        for model in models_to_try:
            try:
                logger.info("Tentative Gemini avec le modèle: %s", model)
                response = await cls._call_gemini(client, model, prompt, **kwargs)
                logger.info("Succès avec le modèle: %s", model)
                return response
            except ClientError:
                logger.exception("Erreur client Gemini (non transitoire) — abandon")
                raise
            except Exception as e:
                logger.warning(
                    "Échec définitif avec %s après retries, passage au modèle suivant",
                    model,
                )
                last_error = e
                continue

        raise last_error

    @classmethod
    async def generate_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        if not settings.GEMINI_GENERATION_API_KEY:
            logger.error("GEMINI_API_KEY manquante — bascule en mode mock.")
            return cls._generate_mock_response(anonymized_question, context_chunks)

        prompt = cls._build_prompt(anonymized_question, context_chunks)

        try:
            logger.info("========== GEMINI ==========")
            logger.info("Modèle principal: %s", cls.MODEL)
            logger.info("Modèles de secours: %s", cls.FALLBACK_MODELS)
            logger.info("API Key présente: %s", bool(settings.GEMINI_GENERATION_API_KEY))

            client = genai.Client(api_key=settings.GEMINI_GENERATION_API_KEY)
            response = await cls._generate_with_fallback(client, prompt)

            if response.text:
                return response.text.strip()

            logger.warning("Gemini a répondu sans texte (response.text vide).")
            return "Le modèle n'a retourné aucune réponse."

        except Exception:
            logger.exception("Tous les modèles Gemini ont échoué — mode mock")
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

Cette réponse est simulée car Gemini n'est pas disponible.
"""

    @classmethod
    async def analyze_document(
        cls,
        document_text: str,
        instructions_utilisateur: str = "",
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> AnalyseDocumentResponse:
        if not settings.GEMINI_GENERATION_API_KEY:
            logger.error("GEMINI_API_KEY manquante — bascule en mode mock.")
            return cls._generate_mock_analysis(document_text)

        context = cls._build_context(context_chunks or [])
        instructions = instructions_utilisateur.strip() or (
            "Analyse ce document juridique : résume les points clés, "
            "identifie les clauses à risque et vérifie sa conformité au droit marocain."
        )

        prompt = f"""Tu es BayanIA, un assistant juridique spécialisé dans le droit marocain.

Analyse le document ci-dessous en respectant STRICTEMENT ces règles :
1. Base-toi uniquement sur le texte du document et le contexte juridique fourni.
2. N'invente jamais une clause ou un article qui n'existe pas dans le document.
3. Si aucune clause à risque n'est identifiée, retourne une liste vide.
4. Réponds en français.

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
            client = genai.Client(api_key=settings.GEMINI_GENERATION_API_KEY)
            response = await cls._generate_with_fallback(
                client,
                prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": AnalyseDocumentResponse,
                },
            )
            if response.text:
                import json
                data = json.loads(response.text)
                return AnalyseDocumentResponse(**data)

            logger.warning("Gemini a répondu sans texte pour l'analyse de document.")
            return cls._generate_mock_analysis(document_text)

        except Exception:
            logger.exception("Erreur Gemini lors de l'analyse de document")
            return cls._generate_mock_analysis(document_text)

    @classmethod
    def _generate_mock_analysis(cls, document_text: str) -> AnalyseDocumentResponse:
        extrait = document_text[:300]
        return AnalyseDocumentResponse(
            resume=f"[MODE TEST] Analyse simulée car Gemini n'est pas disponible. Extrait : {extrait}...",
            clauses_risque=[],
            conformite="Non évalué (mode test — Gemini indisponible).",
            recommandations=["Configurez GEMINI_API_KEY pour une analyse réelle."],
        )