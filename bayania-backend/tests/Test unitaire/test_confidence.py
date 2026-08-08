import pytest
from unittest.mock import patch, AsyncMock

from app.services.confidence_service import ConfidenceService

pytestmark = pytest.mark.unit


# --- Cas limites simples (pas besoin de mock, court-circuités avant embedding) ---

@pytest.mark.asyncio
async def test_no_sources_returns_zero_confidence():
    result = await ConfidenceService.calculate_score("Une réponse quelconque.", [])
    assert result["confidence"] == 0.0
    assert result["abstained"] is False


@pytest.mark.asyncio
async def test_insufficient_context_marker_returns_full_confidence_abstained():
    response = "Les informations insuffisantes disponibles ne permettent pas de répondre précisément."
    sources = [{"score": 0.9, "numero_article": "1", "contenu_texte": "peu importe"}]

    result = await ConfidenceService.calculate_score(response, sources)
    assert result["confidence"] == 1.0
    assert result["abstained"] is True


# --- Signal 1 : retrieval (testable directement, pas de mock nécessaire) ---

def test_retrieval_score_high_top1_and_average():
    sources = [{"score": 0.9}, {"score": 0.8}, {"score": 0.7}]
    score = ConfidenceService._retrieval_score(sources)
    # top1=0.9, avg=0.8 -> 0.5*0.9 + 0.5*0.8 = 0.85
    assert score == pytest.approx(0.85, abs=0.01)


def test_retrieval_score_clamps_out_of_range_values():
    sources = [{"score": 1.5}, {"score": -0.3}]  # valeurs hors bornes
    score = ConfidenceService._retrieval_score(sources)
    assert 0.0 <= score <= 1.0


# --- Signal 2 : citation (regex à limites de mots) ---

def test_citation_score_detects_exact_article_mention():
    sources = [{"numero_article": "9"}]
    response_lower = "conformément à l'article 9 du code civil."
    score = ConfidenceService._citation_score(response_lower, sources)
    assert score == 1.0


def test_citation_score_does_not_false_positive_on_partial_match():
    """L'article '9' ne doit PAS matcher dans 'article 19' ou '9h'."""
    sources = [{"numero_article": "9"}]
    response_lower = "voir l'article 19 et rendez-vous à 9h."
    score = ConfidenceService._citation_score(response_lower, sources)
    assert score == 0.0


def test_citation_score_partial_when_only_some_articles_cited():
    sources = [{"numero_article": "1"}, {"numero_article": "2"}]
    response_lower = "l'article 1 précise que..."
    score = ConfidenceService._citation_score(response_lower, sources)
    assert score == 0.5


# --- Signal 3 : groundedness (mock de EmbeddingService, pas de vrai appel réseau) ---

@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding", new_callable=AsyncMock)
async def test_groundedness_high_when_sentence_matches_context(mock_embed):
    # Vecteurs identiques => cosine similarity = 1.0 => bien "grounded"
    mock_embed.return_value = [1.0, 0.0, 0.0]

    sources = [{"score": 0.9, "numero_article": "1", "contenu_texte": "Le Maroc est une monarchie."}]
    response = "Le Maroc est une monarchie constitutionnelle selon la loi."

    result = await ConfidenceService.calculate_score(response, sources)
    assert result["groundedness"] == 1.0


@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding", new_callable=AsyncMock)
async def test_groundedness_low_when_sentence_unrelated_to_context(mock_embed):
    # Vecteurs orthogonaux => cosine similarity = 0.0 => pas "grounded" (hallucination potentielle)
    call_count = {"n": 0}

    async def alternating_vectors(_text):
        call_count["n"] += 1
        return [1.0, 0.0, 0.0] if call_count["n"] == 1 else [0.0, 1.0, 0.0]

    mock_embed.side_effect = alternating_vectors

    sources = [{"score": 0.9, "numero_article": "1", "contenu_texte": "Le Maroc est une monarchie."}]
    response = "Les licornes vivent sur la lune et mangent des étoiles filantes."

    result = await ConfidenceService.calculate_score(response, sources)
    assert result["groundedness"] == 0.0


@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding", new_callable=AsyncMock)
async def test_groundedness_falls_back_gracefully_on_embedding_failure(mock_embed):
    """Si l'API d'embedding échoue (quota, timeout...), on ne doit pas planter tout le calcul."""
    mock_embed.side_effect = Exception("Embedding API timeout")

    sources = [{"score": 0.9, "numero_article": "1", "contenu_texte": "Contenu quelconque suffisamment long."}]
    response = "Une réponse suffisamment longue pour être analysée par le système."

    result = await ConfidenceService.calculate_score(response, sources)
    assert result["groundedness"] == 0.5  # valeur neutre de repli
    assert result["confidence"] >= 0.0  # ne plante pas


# --- Test bout-en-bout combinant les 3 signaux ---

@pytest.mark.asyncio
@patch("app.services.confidence_service.EmbeddingService.get_embedding", new_callable=AsyncMock)
async def test_calculate_score_combines_all_three_signals_correctly(mock_embed):
    mock_embed.return_value = [1.0, 0.0, 0.0]  # groundedness = 1.0 pour toutes les phrases

    sources = [{"score": 0.9, "numero_article": "1", "contenu_texte": "Le Maroc est une monarchie constitutionnelle."}]
    response = "Conformément à l'article 1, le Maroc est une monarchie constitutionnelle."

    result = await ConfidenceService.calculate_score(response, sources)

    # retrieval = 0.9 (top1=avg=0.9), citation = 1.0, groundedness = 1.0
    # confidence = 0.4*0.9 + 0.2*1.0 + 0.4*1.0 = 0.96
    assert result["confidence"] == pytest.approx(0.96, abs=0.02)
    assert result["abstained"] is False