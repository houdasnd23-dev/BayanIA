import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.source_juridique import SourceJuridique
from app.models.importation_document import ImportationDocument
#: expose la recherche sémantique de sources juridiques via embedding + Qdrant.
@pytest.mark.asyncio
async def test_get_source_success(client: AsyncClient, db_session: AsyncSession):
    # 1. Register & Login user
    reg_payload = {
        "nom_user": "Source Tester",
        "email": "source.test@example.com",
        "mot_de_passe": "pass123",
        "type_profil": "normal"
    }
    await client.post("/auth/register", json=reg_payload)
    login_res = await client.post("/auth/login", json={"email": "source.test@example.com", "mot_de_passe": "pass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup database source
    importation = ImportationDocument(statut_indexation="COMPLETED")
    db_session.add(importation)
    await db_session.commit()
    
    source = SourceJuridique(
        type_source="Loi",
        titre_document="Loi 09-08 relative à la protection des personnes physiques",
        contenu_texte="Article premier: L'informatique doit être au service de chaque citoyen.",
        numero_article="Article premier",
        statut_validite=True,
        id_importation=importation.id_importation
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)

    # 3. Call endpoint
    endpoint = f"/sources/{source.id_source}"
    response = await client.get(endpoint, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id_source"] == source.id_source
    assert data["type_source"] == "Loi"
    assert "Loi 09-08" in data["titre_document"]
    assert "protection" in data["titre_document"]
    assert data["numero_article"] == "Article premier"
    assert "L'informatique" in data["contenu_texte"]

@pytest.mark.asyncio
async def test_get_source_not_found(client: AsyncClient):
    # 1. Register & Login user
    reg_payload = {
        "nom_user": "Source Tester 2",
        "email": "source2.test@example.com",
        "mot_de_passe": "pass123",
        "type_profil": "normal"
    }
    await client.post("/auth/register", json=reg_payload)
    login_res = await client.post("/auth/login", json={"email": "source2.test@example.com", "mot_de_passe": "pass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get non-existent source
    response = await client.get("/sources/99999", headers=headers)
    assert response.status_code == 404
    assert response.json()["error"]["message"] == "Legal source not found"
