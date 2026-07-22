import httpx
import logging
from typing import List, Dict, Any
from app.core.config import settings
logger = logging.getLogger(__name__)
class LLMService:
    @staticmethod
    def _build_prompt(anonymized_question: str, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Builds the system and user prompt for the LLM.
        """
        context_str = ""
        for idx, chunk in enumerate(context_chunks):
            context_str += f"--- Source [{idx + 1}] : {chunk['titre_document']}, {chunk['numero_article']} ---\n"
            context_str += f"{chunk['contenu_texte']}\n\n"
            
        system_prompt = (
            "Vous êtes un assistant juridique expert pour la plateforme BayanIA. "
            "Répondez à la question de l'utilisateur de manière précise, en vous basant uniquement "
            "sur les sources juridiques fournies dans le contexte ci-dessous. "
            "Si la réponse ne peut pas être trouvée dans le contexte, indiquez clairement que vous ne disposez "
            "pas d'assez d'informations pour répondre de manière certifiée.\n\n"
            f"CONTEXTE JURIDIQUE:\n{context_str}"
        )
        
        user_prompt = f"Question : {anonymized_question}"
        
        return system_prompt + "\n\n" + user_prompt
    @classmethod
    async def generate_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]]
    ) -> str:
        """
          Generates response using configured LLM provider or falls back to mock response.
        """
        prompt = cls._build_prompt(anonymized_question, context_chunks)
        
        if settings.LLM_PROVIDER.lower() == "openai" or settings.LLM_PROVIDER.lower() == "openapi_compatible":
            if not settings.LLM_API_KEY:
                logger.warning("LLM API Key is missing. Falling back to local mock response.")
                return cls._generate_mock_response(anonymized_question, context_chunks)
            
            try:
                headers = {
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": "Vous êtes un assistant juridique de BayanIA. Utilisez les sources fournies pour répondre."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.LLM_API_URL}/chat/completions",
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        logger.error(f"LLM API returned error status {response.status_code}: {response.text}")
                        return cls._generate_mock_response(anonymized_question, context_chunks)
            except Exception as e:
                logger.error(f"Error calling LLM API: {str(e)}")
                return cls._generate_mock_response(anonymized_question, context_chunks)
        else:
            return cls._generate_mock_response(anonymized_question, context_chunks)
    @classmethod
    def _generate_mock_response(
        cls,
        anonymized_question: str,
        context_chunks: List[Dict[str, Any]]
    ) -> str:
        """
        Generates a simulation response for testing or local development without LLM keys.
        """
        if not context_chunks:
            return (
                "Désolé, après recherche dans notre corpus de documents juridiques, "
                "aucune source pertinente n'a été trouvée pour répondre à votre question. "
                "Veuillez préciser votre demande ou contacter un expert juridique."
            )
            
        primary_chunk = context_chunks[0]
        article = primary_chunk["numero_article"]
        doc = primary_chunk["titre_document"]
        excerpt = primary_chunk["contenu_texte"][:200] + "..."

        response = (
            f"[BayanIA MOCK LLM] Sur la base de vos critères, voici les éléments identifiés :\n"
            f"Conformément à l'{article} de la source '{doc}', il est indiqué :\n"
            f"\"{excerpt}\"\n\n"
            f"En réponse à votre question : '{anonymized_question}', nous vous rappelons que ces dispositions juridiques s'appliquent. "
            f"Pour une analyse plus approfondie, vous pouvez consulter la source originale complète."
        )
        return response