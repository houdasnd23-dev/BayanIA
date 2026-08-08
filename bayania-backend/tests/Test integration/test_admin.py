import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch
pytestmark = pytest.mark.integration


async def _create_user_and_get_token(client: AsyncClient, email: str, type_profil: str) -> str:
    await client.post("/auth/register", json={
        "email": email,
        "mot_de_passe": "password123",
        "nom_user": f"User {type_profil}",
        "type_profil": type_profil,
    })
    login = await client.post("/auth/login", json={
        "email": email,
        "mot_de_passe": "password123",
    })
    return login.json()["access_token"]


async def _create_admin_and_get_token(client: AsyncClient, db_session: AsyncSession, email: str) -> str:
    """
    /auth/register refuse à juste titre de créer un compte 'administrateur'
    directement (bonne pratique de sécurité !). Pour tester les routes admin,
    on crée donc un utilisateur normal puis on le promeut directement en base,
    comme le ferait un vrai admin depuis un outil d'administration.
    """
    from app.models.user import User
    from app.models.profil import Profil
    from sqlalchemy.future import select

    await client.post("/auth/register", json={
        "email": email,
        "mot_de_passe": "password123",
        "nom_user": "Admin Test",
        "type_profil": "normal",
    })

    res_profil = await db_session.execute(select(Profil).where(Profil.type_profil == "administrateur"))
    admin_profil = res_profil.scalar_one()

    res_user = await db_session.execute(select(User).where(User.email == email))
    user = res_user.scalar_one()
    user.id_profil = admin_profil.id_profil
    await db_session.commit()

    login = await client.post("/auth/login", json={"email": email, "mot_de_passe": "password123"})
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_normal_user_cannot_access_admin_documents(client: AsyncClient):
    token = await _create_user_and_get_token(client, "normal.admin1@test.com", "normal")
    response = await client.get("/admin/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_normal_user_cannot_access_admin_utilisateurs(client: AsyncClient):
    token = await _create_user_and_get_token(client, "normal.admin2@test.com", "normal")
    response = await client.get("/admin/utilisateurs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_professionnel_cannot_access_admin_documents(client: AsyncClient):
    """Vérifie que 'professionnel' n'a pas non plus les droits admin (seul 'administrateur' doit passer)."""
    token = await _create_user_and_get_token(client, "pro.admin1@test.com", "professionnel")
    response = await client.get("/admin/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_cannot_access_admin_documents(client: AsyncClient):
    response = await client.get("/admin/documents")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_can_list_documents(client: AsyncClient, db_session: AsyncSession):
    token = await _create_admin_and_get_token(client, db_session, "admin1@test.com")
    response = await client.get("/admin/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_can_list_users(client: AsyncClient, db_session: AsyncSession):
    token = await _create_admin_and_get_token(client, db_session, "admin2@test.com")
    response = await client.get("/admin/utilisateurs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
@patch("app.services.ingestion_service.QdrantService.upsert_chunks")
@patch("app.services.ingestion_service.EmbeddingService.get_embeddings")
async def test_admin_can_import_document(mock_embed, mock_upsert, client: AsyncClient, db_session: AsyncSession):
    mock_embed.return_value = [[0.1] * 768]
    mock_upsert.return_value = True

    token = await _create_admin_and_get_token(client, db_session, "admin3@test.com")

    payload = {
        "titre_document": "Test Import Admin",
        "type_source": "Loi",
        "contenu_texte": "Article premier : contenu de test pour import admin.",
    }
    response = await client.post("/admin/documents", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code in (200, 201)


@pytest.mark.asyncio
async def test_normal_user_cannot_import_document(client: AsyncClient):
    token = await _create_user_and_get_token(client, "normal.admin3@test.com", "normal")

    payload = {
        "titre_document": "Tentative non autorisée",
        "type_source": "Loi",
        "contenu_texte": "Contenu quelconque.",
    }
    response = await client.post("/admin/documents", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_delete_document(client: AsyncClient, db_session: AsyncSession):
    from app.models.importation_document import ImportationDocument

    importation = ImportationDocument(statut_indexation="COMPLETED")
    db_session.add(importation)
    await db_session.commit()
    await db_session.refresh(importation)

    token = await _create_admin_and_get_token(client, db_session, "admin4@test.com")
    response = await client.delete(
        f"/admin/documents/{importation.id_importation}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in (200, 204)


@pytest.mark.asyncio
async def test_normal_user_cannot_delete_document(client: AsyncClient, db_session: AsyncSession):
    from app.models.importation_document import ImportationDocument

    importation = ImportationDocument(statut_indexation="COMPLETED")
    db_session.add(importation)
    await db_session.commit()
    await db_session.refresh(importation)

    token = await _create_user_and_get_token(client, "normal.admin4@test.com", "normal")
    response = await client.delete(
        f"/admin/documents/{importation.id_importation}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403