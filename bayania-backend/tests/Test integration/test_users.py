import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_get_my_profile_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "profile.test@example.com",
        "mot_de_passe": "password123",
        "nom_user": "Profile Test",
        "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={
        "email": "profile.test@example.com",
        "mot_de_passe": "password123",
    })
    token = login.json()["access_token"]

    response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile.test@example.com"
    assert "mot_de_passe" not in data


@pytest.mark.asyncio
async def test_get_my_profile_requires_auth(client: AsyncClient):
    response = await client.get("/users/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_update_my_profile_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "update.test@example.com",
        "mot_de_passe": "password123",
        "nom_user": "Update Test",
        "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={
        "email": "update.test@example.com",
        "mot_de_passe": "password123",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # ⚠️ Ajuste les champs selon ton schéma UserUpdate réel
    response = await client.put("/users/me", json={
        "nom_user": "Nouveau Nom",
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["nom_user"] == "Nouveau Nom"


@pytest.mark.asyncio
async def test_update_my_profile_cannot_change_email_to_existing(client: AsyncClient):
    """Vérifie qu'on ne peut pas changer son email vers un email déjà pris par un autre compte."""
    await client.post("/auth/register", json={
        "email": "taken@example.com",
        "mot_de_passe": "password123",
        "nom_user": "Taken User",
        "type_profil": "normal",
    })
    await client.post("/auth/register", json={
        "email": "changer@example.com",
        "mot_de_passe": "password123",
        "nom_user": "Changer User",
        "type_profil": "normal",
    })
    login = await client.post("/auth/login", json={
        "email": "changer@example.com",
        "mot_de_passe": "password123",
    })
    token = login.json()["access_token"]

    response = await client.put("/users/me", json={
        "email": "taken@example.com",
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code in (400, 409)