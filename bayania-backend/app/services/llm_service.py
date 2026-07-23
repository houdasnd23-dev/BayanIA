import logging
from typing import List, Dict, Any, Optional

from google import genai

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:

    SYSTEM_RULES = """Tu es BayanIA, un assistant juridique spécialisé dans le droit marocain.

Tu dois respecter STRICTEMENT les règles suivantes :

1. Réponds uniquement à partir du contexte fourni.
2. N'invente jamais une règle juridique.
3. Si le contexte ne permet pas de répondre, indique clairement que les informations sont insuffisantes.
4. Cite toujours les articles utilisés.
5. Réponds en français.
6. Structure ta réponse ainsi :

Réponse

Explication

Références juridiques
"""

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

    @classmethod
    async def generate_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]],
    ) -> str:
        if not settings.GEMINI_API_KEY:
            logger.error("GEMINI_API_KEY manquante — bascule en mode mock.")
            return cls._generate_mock_response(anonymized_question, context_chunks)

        prompt = cls._build_prompt(anonymized_question, context_chunks)

        try:

             logger.info("========== GEMINI ==========")
             logger.info("Provider: %s", settings.LLM_PROVIDER)
             logger.info("Model: %s", settings.LLM_MODEL)
             logger.info("API Key présente: %s", bool(settings.GEMINI_API_KEY))
             logger.info("API Key (début): %s", settings.GEMINI_API_KEY[:10] if settings.GEMINI_API_KEY else "AUCUNE")

             client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Appel async natif du SDK : ne bloque pas la boucle d'événements
            # FastAPI pendant que d'autres requêtes sont en cours.
             response = await client.aio.models.generate_content(
                model=settings.LLM_MODEL,
                contents=prompt,
            )

             if response.text:
                return response.text.strip()

             logger.warning("Gemini a répondu sans texte (response.text vide).")
             return "Le modèle n'a retourné aucune réponse."

        except Exception as e:
            logger.exception("Erreur Gemini")
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