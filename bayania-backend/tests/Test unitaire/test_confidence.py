import pytest
from unittest.mock import AsyncMock, patch

from app.services.confidence_service import ConfidenceService


# ================================================================
# 1. ABSENCE DE SOURCES
# ================================================================

@pytest.mark.asyncio
async def test_no_sources_returns_zero_confidence():
    """
    Si aucune source n'a été retrouvée, le score de confiance
    doit être nul sur tous les signaux, et la réponse ne doit
    pas être considérée comme une abstention.
    """
    result = await ConfidenceService.calculate_score(
        response_text="Le Maroc est une monarchie constitutionnelle.",
        retrieved_sources=[],
    )

    assert result["confidence"] == 0.0
    assert result["retrieval"] == 0.0
    assert result["citation"] == 0.0
    assert result["groundedness"] == 0.0
    assert result["abstained"] is False


# ================================================================
# 2. VALEURS LIMITES DU SCORE DE RETRIEVAL
# ================================================================

def test_retrieval_score_uses_best_and_average():
    """
    retrieval = 0.5 * meilleur_score + 0.5 * moyenne_des_scores
    """
    sources = [
        {"score": 0.9},
        {"score": 0.5},
    ]

    retrieval = ConfidenceService._retrieval_score(sources)

    # meilleur = 0.9, moyenne = 0.7 -> 0.5*0.9 + 0.5*0.7 = 0.8
    assert retrieval == pytest.approx(0.8, abs=0.01)


def test_retrieval_score_clips_out_of_range_values():
    """
    Un score hors de [0, 1] (valeur aberrante ou mal calibrée)
    doit être ramené dans les bornes avant le calcul.
    """
    sources = [
        {"score": 1.5},   # doit être ramené à 1.0
        {"score": -0.3},  # doit être ramené à 0.0
    ]

    retrieval = ConfidenceService._retrieval_score(sources)

    assert 0.0 <= retrieval <= 1.0


# ================================================================
# 3. DÉTECTION DES CITATIONS JURIDIQUES
# ================================================================

def test_citation_detected_when_article_correctly_cited():
    """
    Une source dont l'article est explicitement cité dans la
    réponse doit être comptabilisée.
    """
    sources = [
        {"numero_article": "Article premier"},
    ]
    response = "conformément à l'article premier de la constitution, le maroc est une monarchie."

    citation = ConfidenceService._citation_score(response, sources)

    assert citation == 1.0


def test_citation_avoids_false_positive_on_similar_numbers():
    """
    "article 9" ne doit pas être détecté à tort dans "article 19"
    (protection par les limites de mots \\b).
    """
    sources = [
        {"numero_article": "Article 9"},
    ]
    response = "cette disposition est prévue par l'article 19 du code."

    citation = ConfidenceService._citation_score(response, sources)

    assert citation == 0.0


# ================================================================
# 4. CITATIONS INCOMPLÈTES
# ================================================================

def test_citation_score_is_partial_when_only_some_sources_cited():
    """
    Si seule une partie des sources retrouvées est effectivement
    citée dans la réponse, le score doit refléter cette proportion.
    """
    sources = [
        {"numero_article": "Article premier"},
        {"numero_article": "Article 9"},
    ]
    response = "conformément à l'article premier, le maroc est une monarchie."

    citation = ConfidenceService._citation_score(response, sources)

    assert citation == pytest.approx(0.5, abs=0.01)


# ================================================================
# 5. ANCRAGE (GROUNDEDNESS) DANS LE CONTEXTE FOURNI
# ================================================================

@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding")
async def test_groundedness_high_when_response_matches_context(mock_embed):
    """
    Si chaque phrase de la réponse est sémantiquement proche
    du contexte (ici : embeddings identiques simulés), le score
    d'ancrage doit être maximal.
    """
    mock_embed.return_value = [0.1] * 384

    sources = [
        {"contenu_texte": "Article premier: Le Maroc est une monarchie constitutionnelle."},
    ]
    response = "Le Maroc est une monarchie constitutionnelle."

    groundedness = await ConfidenceService._groundedness_score(response, sources)

    assert groundedness == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding")
async def test_groundedness_low_when_response_diverges_from_context(mock_embed):
    """
    Si la réponse n'a aucun lien sémantique avec le contexte fourni
    (embeddings orthogonaux simulés), le score d'ancrage doit être nul.
    """

    async def fake_embedding(text):
        # Vecteurs orthogonaux selon le texte reçu
        if "contexte" in text.lower():
            return [1.0, 0.0]
        return [0.0, 1.0]

    mock_embed.side_effect = fake_embedding

    sources = [
        {"contenu_texte": "Ceci est le contexte juridique de référence."},
    ]
    response = "Cette phrase n'a aucun rapport sémantique avec la source ci-dessus."

    groundedness = await ConfidenceService._groundedness_score(response, sources)

    assert groundedness == pytest.approx(0.0, abs=0.01)


# ================================================================
# 6. COMBINAISON DES SIGNAUX DANS LE SCORE FINAL
# ================================================================

@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding")
async def test_confidence_combines_three_signals_with_correct_weights(mock_embed):
    """
    confidence = 0.4 * retrieval + 0.2 * citation + 0.4 * groundedness
    """
    mock_embed.return_value = [0.1] * 384

    sources = [
        {
            "numero_article": "Article premier",
            "contenu_texte": "Le Maroc est une monarchie constitutionnelle.",
            "score": 0.95,
        },
    ]
    response_text = "Conformément à l'article premier, le Maroc est une monarchie constitutionnelle."

    result = await ConfidenceService.calculate_score(
        response_text=response_text,
        retrieved_sources=sources,
    )

    expected = (
        0.4 * result["retrieval"]
        + 0.2 * result["citation"]
        + 0.4 * result["groundedness"]
    )

    assert result["confidence"] == pytest.approx(expected, abs=0.01)
    assert result["abstained"] is False


# ================================================================
# 7. ABSTENTION DU MODÈLE
# ================================================================

@pytest.mark.asyncio
async def test_abstained_response_returns_full_confidence_flag():
    """
    Lorsque le modèle indique explicitement qu'il ne dispose pas
    d'assez d'informations, la réponse doit être marquée comme
    une abstention, avec un score de confiance de 1.0 (le système
    a correctement reconnu ses limites).
    """
    sources = [
        {"numero_article": "Article 3", "score": 0.4},
    ]
    response_text = "Les informations disponibles ne permettent pas de répondre précisément à cette question."

    result = await ConfidenceService.calculate_score(
        response_text=response_text,
        retrieved_sources=sources,
    )

    assert result["abstained"] is True
    assert result["confidence"] == 1.0


# ================================================================
# 8. ÉCHEC DU SERVICE D'EMBEDDING
# ================================================================

@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding")
async def test_groundedness_falls_back_to_neutral_score_on_embedding_failure(mock_embed):
    """
    Si le service d'embedding échoue (ex : API indisponible), le
    calcul de l'ancrage ne doit pas faire planter tout le pipeline :
    une valeur neutre (0.5) doit être renvoyée en repli.
    """
    mock_embed.side_effect = Exception("Embedding service unavailable")

    sources = [
        {"contenu_texte": "Article premier: Le Maroc est une monarchie constitutionnelle."},
    ]
    response = "Le Maroc est une monarchie constitutionnelle."

    groundedness = await ConfidenceService._groundedness_score(response, sources)

    assert groundedness == 0.5


@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding")
async def test_calculate_score_still_returns_all_keys_on_embedding_failure(mock_embed):
    """
    Même en cas d'échec du service d'embedding, calculate_score
    doit renvoyer un dictionnaire complet et cohérent plutôt que
    de lever une exception.
    """
    mock_embed.side_effect = Exception("Embedding service unavailable")

    sources = [
        {
            "numero_article": "Article premier",
            "contenu_texte": "Le Maroc est une monarchie constitutionnelle.",
            "score": 0.9,
        },
    ]
    response_text = "Conformément à l'article premier, le Maroc est une monarchie constitutionnelle."

    result = await ConfidenceService.calculate_score(
        response_text=response_text,
        retrieved_sources=sources,
    )

    assert set(result.keys()) == {
        "confidence",
        "retrieval",
        "citation",
        "groundedness",
        "abstained",
    }
    assert result["groundedness"] == 0.5