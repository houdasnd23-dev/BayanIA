import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch
pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_questions_requires_auth(client: AsyncClient):
    response = await client.get("/questions")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_questions_returns_only_own_questions(client: AsyncClient, db_session: AsyncSession):
    from app.models.question import Question
    from app.models.user import User
    from sqlalchemy.future import select

    await client.post("/auth/register", json={
        "email": "lister@test.com", "mot_de_passe": "password123",
        "nom_user": "Lister", "type_profil": "normal",
    })
    await client.post("/auth/register", json={
        "email": "autre@test.com", "mot_de_passe": "password123",
        "nom_user": "Autre", "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={"email": "lister@test.com", "mot_de_passe": "password123"})
    token = login.json()["access_token"]

    res_user1 = await db_session.execute(select(User).where(User.email == "lister@test.com"))
    user1 = res_user1.scalar_one()
    res_user2 = await db_session.execute(select(User).where(User.email == "autre@test.com"))
    user2 = res_user2.scalar_one()

    db_session.add(Question(texte_question_brute="Q1", texte_question_anonymise="Q1", mode_reponse="brève", id_user=user1.id_user))
    db_session.add(Question(texte_question_brute="Q2", texte_question_anonymise="Q2", mode_reponse="brève", id_user=user2.id_user))
    await db_session.commit()

    response = await client.get("/questions", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    # Ne doit contenir QUE les questions de user1, pas celles de user2
    assert all(q.get("texte_question_brute") != "Q2" for q in data)


from unittest.mock import patch

@pytest.mark.asyncio
@patch("app.routers.sources.QdrantService.search_similar")
@patch("app.routers.sources.EmbeddingService.get_embedding")
async def test_search_sources_success(mock_embed, mock_search, client: AsyncClient, db_session: AsyncSession):
    from app.models.source_juridique import SourceJuridique
    from app.models.importation_document import ImportationDocument

    mock_embed.return_value = [0.1] * 768
    mock_search.return_value = [{
        "id_source": 1,
        "titre_document": "Loi sur la protection des données",
        "contenu_texte": "Contenu relatif à la protection des données personnelles.",
        "numero_article": "Article 1",
        "score": 0.95,
    }]  # ⚠️ adapte les champs à ton schema SourceSearchResult

    await client.post("/auth/register", json={
        "email": "search.test@example.com", "mot_de_passe": "pass123",
        "nom_user": "Search Test", "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={"email": "search.test@example.com", "mot_de_passe": "pass123"})
    token = login.json()["access_token"]

    importation = ImportationDocument(statut_indexation="COMPLETED")
    db_session.add(importation)
    await db_session.commit()

    source = SourceJuridique(
        type_source="Loi", titre_document="Loi sur la protection des données",
        contenu_texte="Contenu relatif à la protection des données personnelles.",
        numero_article="Article 1", statut_validite=True,
        id_importation=importation.id_importation,
    )
    db_session.add(source)
    await db_session.commit()

    response = await client.get("/sources/search", params={"q": "protection"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1


@pytest.mark.asyncio
@patch("app.routers.sources.QdrantService.search_similar")
@patch("app.routers.sources.EmbeddingService.get_embedding")
async def test_search_sources_no_results(mock_embed, mock_search, client: AsyncClient):
    mock_embed.return_value = [0.1] * 768
    mock_search.return_value = []

    await client.post("/auth/register", json={
        "email": "search2.test@example.com", "mot_de_passe": "pass123",
        "nom_user": "Search Test 2", "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={"email": "search2.test@example.com", "mot_de_passe": "pass123"})
    token = login.json()["access_token"]

    response = await client.get("/sources/search", params={"q": "termeintrouvablexyz"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []