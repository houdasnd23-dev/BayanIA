import pytest
from unittest.mock import patch, MagicMock

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.question import Question
from app.models.donnee_sensible import DonneeSensible
from app.models.reponse_ia import ReponseIA
from app.models.piece_jointe import PieceJointe
from app.models.source_juridique import SourceJuridique
from app.models.importation_document import ImportationDocument
from app.models.user import User
from app.models.profil import Profil


@pytest.mark.asyncio
@patch("app.services.embedding_service.EmbeddingService.get_embedding")
@patch("app.services.qdrant_service.QdrantService.search_similar")
@patch("app.services.llm_service.LLMService.generate_response")
async def test_create_question_success(
    mock_llm,
    mock_search,
    mock_embed,
    client: AsyncClient,
    db_session: AsyncSession
):
    # Register & Login user
    reg_payload = {
        "nom_user": "User Test",
        "email": "user.test@example.com",
        "mot_de_passe": "password123",
        "type_profil": "normal"
    }

    register_res = await client.post(
        "/auth/register",
        json=reg_payload
    )
    assert register_res.status_code == 201

    login_payload = {
        "email": "user.test@example.com",
        "mot_de_passe": "password123"
    }

    login_res = await client.post(
        "/auth/login",
        json=login_payload
    )

    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Setup database
    importation = ImportationDocument(
        statut_indexation="COMPLETED"
    )

    db_session.add(importation)
    await db_session.commit()
    await db_session.refresh(importation)

    source = SourceJuridique(
        type_source="Constitution",
        titre_document="Constitution 2011",
        contenu_texte=(
            "Article premier: Le Maroc est une monarchie "
            "constitutionnelle."
        ),
        numero_article="Article premier",
        statut_validite=True,
        id_importation=importation.id_importation
    )

    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)

    # Mock embedding
    mock_embed.return_value = [0.1] * 384

    # Mock Qdrant
    mock_search.return_value = [{
        "id_source": source.id_source,
        "titre_document": source.titre_document,
        "numero_article": source.numero_article,
        "contenu_texte": source.contenu_texte,
        "type_source": source.type_source,
        "score": 0.95
    }]

    # Mock LLM
    mock_llm.return_value = (
        "Conformément à l'Article premier de la Constitution 2011, "
        "le Maroc est une monarchie constitutionnelle."
    )

    # Question containing sensitive information
    question_payload = {
        "texte_question_brute": (
            "Bonjour, mon email est test@example.com et mon numéro "
            "est 0612345678. Quel est le régime du Maroc?"
        ),
        "mode_reponse": "synthèse"
    }

    response = await client.post(
        "/questions",
        json=question_payload,
        headers=headers
    )

    assert response.status_code == 201

    data = response.json()

    assert "id_question" in data
    assert "[EMAIL_1]" in data["texte_question_anonymise"]
    assert "[TELEPHONE_1]" in data["texte_question_anonymise"]
    assert len(data["donnees_sensibles"]) == 2

    # Verify database state
    question_id = data["id_question"]

    stmt = (
        select(Question)
        .where(Question.id_question == question_id)
        .options(
            selectinload(Question.donnees_sensibles),
            selectinload(
                Question.reponse_ia
            ).selectinload(
                ReponseIA.sources
            )
        )
    )

    res = await db_session.execute(stmt)
    db_q = res.scalar_one_or_none()

    assert db_q is not None
    assert len(db_q.donnees_sensibles) == 2
    assert db_q.reponse_ia is not None
    assert "monarchie constitutionnelle" in (
        db_q.reponse_ia.texte_reponse
    )
    assert len(db_q.reponse_ia.sources) == 1
    assert db_q.reponse_ia.sources[0].id_source == source.id_source


@pytest.mark.asyncio
async def test_get_question_response_permissions(
    client: AsyncClient,
    db_session: AsyncSession
):
    # ============================================================
    # 1. Register users
    # ============================================================

    users = {
        "owner": {
            "nom_user": "Owner User",
            "email": "owner@test.com",
            "mot_de_passe": "pass",
            "type_profil": "normal"
        },
        "other": {
            "nom_user": "Other User",
            "email": "other@test.com",
            "mot_de_passe": "pass",
            "type_profil": "normal"
        },
        "pro": {
            "nom_user": "Pro User",
            "email": "pro@test.com",
            "mot_de_passe": "pass",
            "type_profil": "professionnel"
        },
        # IMPORTANT :
        # l'utilisateur ne peut plus s'inscrire directement
        # avec le rôle administrateur.
        "admin": {
            "nom_user": "Admin User",
            "email": "admin@test.com",
            "mot_de_passe": "pass",
            "type_profil": "normal"
        }
    }

    tokens = {}

    for key, val in users.items():

        # Register
        register_res = await client.post(
            "/auth/register",
            json=val
        )

        assert register_res.status_code == 201

        # Login
        login_res = await client.post(
            "/auth/login",
            json={
                "email": val["email"],
                "mot_de_passe": val["mot_de_passe"]
            }
        )

        assert login_res.status_code == 200

        login_data = login_res.json()

        assert "access_token" in login_data

        tokens[key] = login_data["access_token"]

    # ============================================================
    # 2. Give the admin user the existing administrator profile
    # ============================================================

    res_admin = await db_session.execute(
        select(User)
        .where(User.email == "admin@test.com")
        .options(selectinload(User.profil))
    )

    admin_db = res_admin.scalar_one()

    # Retrieve the existing administrator profile.
    # We do NOT modify the type_profil of the existing normal profile,
    # because type_profil is unique in the profils table.
    res_profil_admin = await db_session.execute(
        select(Profil)
        .where(
            Profil.type_profil == "administrateur"
        )
    )

    profil_admin = res_profil_admin.scalar_one_or_none()

    # Create it only if the test database does not already contain it.
    if profil_admin is None:
        profil_admin = Profil(
            type_profil="administrateur"
        )

        db_session.add(profil_admin)

        await db_session.commit()
        await db_session.refresh(profil_admin)

    # Associate admin user with administrator profile
    admin_db.id_profil = profil_admin.id_profil

    await db_session.commit()

    # Reload admin with profile
    await db_session.refresh(admin_db)

    # ============================================================
    # 3. Get owner user
    # ============================================================

    res_user = await db_session.execute(
        select(User)
        .where(User.email == "owner@test.com")
    )

    owner_db = res_user.scalar_one()

    # ============================================================
    # 4. Create question
    # ============================================================

    question = Question(
        texte_question_brute="Question simple",
        texte_question_anonymise="Question simple",
        mode_reponse="brève",
        id_user=owner_db.id_user
    )

    db_session.add(question)

    await db_session.commit()
    await db_session.refresh(question)

    # ============================================================
    # 5. Create response
    # ============================================================

    reponse = ReponseIA(
        texte_reponse="Voici la réponse simple.",
        score_confiance=0.99,
        id_question=question.id_question
    )

    db_session.add(reponse)

    await db_session.commit()

    # ============================================================
    # 6. Test permissions
    # ============================================================

    endpoint = (
        f"/questions/{question.id_question}/reponse"
    )

    # Owner -> 200
    res_owner = await client.get(
        endpoint,
        headers={
            "Authorization": f"Bearer {tokens['owner']}"
        }
    )

    assert res_owner.status_code == 200
    assert (
        res_owner.json()["texte_reponse"]
        == "Voici la réponse simple."
    )

    # Other normal user -> 403
    res_other = await client.get(
        endpoint,
        headers={
            "Authorization": f"Bearer {tokens['other']}"
        }
    )

    assert res_other.status_code == 403

    # Professional user -> 200
    res_pro = await client.get(
        endpoint,
        headers={
            "Authorization": f"Bearer {tokens['pro']}"
        }
    )

    assert res_pro.status_code == 200
    assert (
        res_pro.json()["texte_reponse"]
        == "Voici la réponse simple."
    )

    # Administrator -> 200
    res_admin = await client.get(
        endpoint,
        headers={
            "Authorization": f"Bearer {tokens['admin']}"
        }
    )

    assert res_admin.status_code == 200
    assert (
        res_admin.json()["texte_reponse"]
        == "Voici la réponse simple."
    )

    # Non-existent question -> 404
    res_404 = await client.get(
        "/questions/99999/reponse",
        headers={
            "Authorization": f"Bearer {tokens['owner']}"
        }
    )

    assert res_404.status_code == 404


@pytest.mark.asyncio
@patch("app.utils.file_storage.FileStorage.save_file")
async def test_upload_piece_jointe(
    mock_save_file,
    client: AsyncClient,
    db_session: AsyncSession
):
    # Setup mock file storage
    mock_save_file.return_value = "./uploads/test_file.txt"

    # Register & Login Owner
    reg_payload = {
        "nom_user": "Attachment Owner",
        "email": "att.owner@test.com",
        "mot_de_passe": "password",
        "type_profil": "normal"
    }

    register_res = await client.post(
        "/auth/register",
        json=reg_payload
    )

    assert register_res.status_code == 201

    login_res = await client.post(
        "/auth/login",
        json={
            "email": "att.owner@test.com",
            "mot_de_passe": "password"
        }
    )

    assert login_res.status_code == 200

    token = login_res.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Register & Login Other User
    register_other = await client.post(
        "/auth/register",
        json={
            "nom_user": "Att Other",
            "email": "att.other@test.com",
            "mot_de_passe": "password",
            "type_profil": "normal"
        }
    )

    assert register_other.status_code == 201

    login_res_other = await client.post(
        "/auth/login",
        json={
            "email": "att.other@test.com",
            "mot_de_passe": "password"
        }
    )

    assert login_res_other.status_code == 200

    token_other = login_res_other.json()["access_token"]

    headers_other = {
        "Authorization": f"Bearer {token_other}"
    }

    # Get owner
    res_user = await db_session.execute(
        select(User)
        .where(User.email == "att.owner@test.com")
    )

    owner_db = res_user.scalar_one()

    # Create question
    question = Question(
        texte_question_brute="Question avec fichier",
        texte_question_anonymise="Question avec fichier",
        mode_reponse="brève",
        id_user=owner_db.id_user
    )

    db_session.add(question)

    await db_session.commit()
    await db_session.refresh(question)

    # File content
    file_content = b"Contenu du document de test"

    files = {
        "file": (
            "test_file.txt",
            file_content,
            "text/plain"
        )
    }

    # Other user -> forbidden
    res_fail = await client.post(
        f"/questions/{question.id_question}/pieces-jointes",
        files=files,
        headers=headers_other
    )

    assert res_fail.status_code == 403

    # Owner -> success
    files = {
        "file": (
            "test_file.txt",
            file_content,
            "text/plain"
        )
    }

    res_success = await client.post(
        f"/questions/{question.id_question}/pieces-jointes",
        files=files,
        headers=headers
    )

    assert res_success.status_code == 201

    data = res_success.json()

    assert data["nom_fichier"] == "test_file.txt"
    assert data["chemin_fichier"] == "./uploads/test_file.txt"

    # Verify database
    stmt = select(PieceJointe).where(
        PieceJointe.id_piece == data["id_piece"]
    )

    res_db = await db_session.execute(stmt)

    db_piece = res_db.scalar_one_or_none()

    assert db_piece is not None
    assert db_piece.nom_fichier == "test_file.txt"
    assert db_piece.id_question == question.id_question