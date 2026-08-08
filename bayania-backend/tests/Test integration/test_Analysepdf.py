import pytest
from unittest.mock import patch
from httpx import AsyncClient

pytestmark = pytest.mark.integration


async def _get_token(client: AsyncClient, email: str) -> str:
    await client.post("/auth/register", json={
        "email": email,
        "mot_de_passe": "password123",
        "nom_user": "PDF Test User",
        "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={"email": email, "mot_de_passe": "password123"})
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_analyse_pdf_requires_auth(client: AsyncClient):
    files = {"file": ("contrat.pdf", b"%PDF-1.4 fake content", "application/pdf")}
    response = await client.post("/documents/analyse-pdf", files=files)
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
@patch("app.routers.documents.QdrantService.search_similar")
@patch("app.routers.documents.EmbeddingService.get_embedding")
@patch("app.services.llm_service.LLMService.generate_response")
@patch("app.routers.documents.extract_text_docling")
async def test_analyse_pdf_success(mock_extract, mock_llm, mock_embed, mock_search, client: AsyncClient):
    token = await _get_token(client, "pdfanalyse@test.com")

    mock_extract.return_value = "Article 12 : En cas de résiliation anticipée, une pénalité de 50% du contrat restant est due."
    mock_llm.return_value = (
        "Clause à risque détectée : pénalité de résiliation anticipée disproportionnée."
    )
    mock_embed.return_value = [0.1] * 768
    mock_search.return_value = []  # pas de contexte trouvé, suffit pour le test

    files = {"file": ("contrat.pdf", b"%PDF-1.4 fake content pour test", "application/pdf")}
    response = await client.post(
        "/documents/analyse-pdf",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "clauses_risque" in data or "clauses" in data

@pytest.mark.asyncio
async def test_analyse_pdf_rejects_non_pdf_file(client: AsyncClient):
    token = await _get_token(client, "pdfanalyse2@test.com")

    files = {"file": ("document.txt", b"Ceci n'est pas un PDF", "text/plain")}
    response = await client.post(
        "/documents/analyse-pdf",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in (400, 415, 422)
