import pytest

from app.utils.chunking import chunk_legal_text

pytestmark = pytest.mark.unit


# ---------- Détection des articles (FR) ----------

def test_splits_on_multiple_numbered_articles():
    text = (
        "Article 1\nLe présent code régit les obligations.\n"
        "Article 2\nToute obligation dérive d'un contrat."
    )
    chunks = chunk_legal_text(text)

    assert len(chunks) == 2
    assert chunks[0]["numero_article"] == "Article 1"
    assert "obligations" in chunks[0]["contenu_texte"]
    assert chunks[1]["numero_article"] == "Article 2"
    assert "contrat" in chunks[1]["contenu_texte"]


def test_recognizes_article_premier():
    text = "Article premier\nLe présent code est applicable à tous."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert chunks[0]["numero_article"] == "Article premier"


def test_recognizes_abbreviated_art_form():
    text = "Art. 12\nDisposition abrégée du code."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert chunks[0]["numero_article"] == "Art. 12"


def test_article_content_stops_before_next_article():
    """Le contenu d'un article ne doit pas déborder sur l'article suivant."""
    text = (
        "Article 1\nContenu du premier article.\n"
        "Article 2\nContenu du second article."
    )
    chunks = chunk_legal_text(text)

    assert "second article" not in chunks[0]["contenu_texte"]
    assert "premier article" not in chunks[1]["contenu_texte"]


# ---------- Détection des articles (AR) ----------

def test_recognizes_arabic_article_marker():
    text = "المادة 1\nنص المادة الأولى من القانون."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert "المادة" in chunks[0]["numero_article"]


def test_recognizes_arabic_al_oula_marker():
    text = "المادة الأولى\nنص تجريبي للمادة الأولى."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert "الأولى" in chunks[0]["numero_article"]


# ---------- Fallback sans marqueur d'article ----------

def test_falls_back_to_paragraphs_when_no_article_marker():
    text = (
        "Ceci est un premier paragraphe suffisamment long pour être retenu.\n\n"
        "Voici un second paragraphe, également assez long pour compter."
    )
    chunks = chunk_legal_text(text)

    assert len(chunks) == 2
    assert chunks[0]["numero_article"] == "Paragraphe 1"
    assert chunks[1]["numero_article"] == "Paragraphe 2"


def test_falls_back_to_general_when_text_too_short_for_paragraph_filter():
    """
    Un texte non vide mais trop court (<=20 caractères) pour passer le filtre
    de paragraphe tombe dans le fallback 'Général'.
    """
    text = "Texte trop court."  # 18 caractères, sans \n\n
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert chunks[0]["numero_article"] == "Général"
    assert chunks[0]["contenu_texte"] == text.strip()


def test_single_long_block_without_double_newline_becomes_paragraphe_1():
    """
    Un texte non vide, assez long (>20 caractères) mais sans double saut de
    ligne ni marqueur d'article, est traité comme un unique paragraphe.
    """
    text = "Texte suffisamment long sans structure d'article ni double saut de ligne."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert chunks[0]["numero_article"] == "Paragraphe 1"


def test_filters_out_very_short_paragraphs():
    """Les paragraphes de moins de 20 caractères doivent être ignorés."""
    text = "Trop court\n\nCeci est un paragraphe suffisamment long pour être conservé."
    chunks = chunk_legal_text(text)

    assert len(chunks) == 1
    assert "suffisamment long" in chunks[0]["contenu_texte"]


# ---------- Cas limites ----------

def test_empty_text_returns_empty_list():
    assert chunk_legal_text("") == []


def test_whitespace_only_text_returns_empty_list():
    assert chunk_legal_text("   \n\n   ") == []


def test_filters_out_articles_with_negligible_content():
    """Un 'article' sans contenu propre (juste l'en-tête, <=10 caractères) doit être ignoré."""
    text = "Article 1\nArticle 2\nContenu correct et suffisamment long."
    chunks = chunk_legal_text(text)

    # "Article 1" seul (9 caractères) est filtré ; seul l'article 2 est retenu
    assert len(chunks) == 1
    assert chunks[0]["numero_article"] == "Article 2"