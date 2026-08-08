# --- Installation (une seule fois) ---
# pip install pytest httpx pytest-asyncio
#
# --- Lancer les tests ---
# pytest test_auth.py -v

import pytest
from httpx import AsyncClient, ASGITransport
import pytest_asyncio
# Adapte cet import au chemin réel de ton app FastAPI
from app.main import app # ex: from app.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "nouveau.test@example.com",
        "mot_de_passe": "MotDePasseSecurise123!",
        "nom_user": "Test User",
    })
    assert response.status_code in (200, 201)
    data = response.json()
    # Le mot de passe ne doit JAMAIS être renvoyé, même hashé
    assert "mot_de_passe" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client):
    payload = {
        "email": "duplicate@example.com",
        "mot_de_passe": "MotDePasseSecurise123!",
        "nom_user": "Test User",
    }
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code in (400, 409)


@pytest.mark.asyncio
async def test_login_success(client):
    # Prérequis : cet utilisateur doit exister (créé via un fixture DB idéalement)
    response = await client.post("/auth/login", json={
        "email": "houda.test@example.com",
        "mot_de_passe": "TestPassword123!",
    })
    assert response.status_code == 200
    assert "access_token" in response.json() or "token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(client):
    response = await client.post("/auth/login", json={
        "email": "houda.test@example.com",
        "mot_de_passe": "mauvais_mot_de_passe",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user_rejected(client):
    response = await client.post("/auth/login", json={
        "email": "inexistant@example.com",
        "mot_de_passe": "peu_importe",
    })
    assert response.status_code in (401, 404)


@pytest.mark.asyncio
async def test_users_me_does_not_leak_password(client):
    # 1. Login pour récupérer un token
    login = await client.post("/auth/login", json={
        "email": "houda.test@example.com",
        "mot_de_passe": "le_bon_mot_de_passe",
    })
    token = login.json().get("access_token") or login.json().get("token")

    # 2. Appel de /users/me avec le token
    response = await client.get("/users/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert "mot_de_passe" not in data  # confirme la fuite qu'on a repérée dans les logs


@pytest.mark.asyncio
async def test_cors_preflight_login(client):
    # Reproduit le bug OPTIONS 400 vu dans les logs
    response = await client.options("/auth/login", headers={
        "Origin": "https://bayan-ia-eight.vercel.app",
        "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 200  # doit passer, pas 400