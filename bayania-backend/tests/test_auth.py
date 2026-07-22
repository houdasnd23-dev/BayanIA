import pytest
from httpx import AsyncClient
@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    payload = {
        "nom_user": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "mot_de_passe": "password123",
        "type_profil": "normal"
    }
    
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nom_user"] == "Jean Dupont"
    assert data["email"] == "jean.dupont@example.com"
    assert "id_user" in data
@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # Register first
    reg_payload = {
        "nom_user": "Alice Smith",
        "email": "alice@example.com",
        "mot_de_passe": "securepwd",
        "type_profil": "professionnel"
    }
    await client.post("/auth/register", json=reg_payload)
    
    # Login
    login_payload = {
        "email": "alice@example.com",
        "mot_de_passe": "securepwd"
    }
    response = await client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
@pytest.mark.asyncio
async def test_admin_permissions(client: AsyncClient):
        # Register a normal user
    await client.post("/auth/register", json={
        "nom_user": "Normal User",
        "email": "normal@example.com",
        "mot_de_passe": "password",
        "type_profil": "normal"
    })
    # Login normal user
    res_login_n = await client.post("/auth/login", json={"email": "normal@example.com", "mot_de_passe": "password"})
    token_n = res_login_n.json()["access_token"]
    
    # Try accessing admin endpoint (should fail)
    headers_n = {"Authorization": f"Bearer {token_n}"}
    res_admin_n = await client.get("/admin/utilisateurs", headers=headers_n)
    assert res_admin_n.status_code == 403
    
    # Register an admin user
    await client.post("/auth/register", json={
        "nom_user": "Admin User",
        "email": "admin@example.com",
        "mot_de_passe": "password",
        "type_profil": "administrateur"
    })
    # Login admin user
    res_login_a = await client.post("/auth/login", json={"email": "admin@example.com", "mot_de_passe": "password"})
    token_a = res_login_a.json()["access_token"]
    
    # Access admin endpoint (should succeed)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res_admin_a = await client.get("/admin/utilisateurs", headers=headers_a)
    assert res_admin_a.status_code == 200
    assert len(res_admin_a.json()) >= 2
