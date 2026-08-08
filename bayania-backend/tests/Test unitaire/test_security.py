import pytest
from datetime import timedelta
from jose import jwt

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings

pytestmark = pytest.mark.unit


# ---------- Hashing ----------

def test_password_hash_and_verify_roundtrip():
    """Un mot de passe hashé doit se vérifier correctement."""
    password = "MotDePasse123!"
    hashed = get_password_hash(password)

    assert hashed != password  # jamais stocké en clair
    assert verify_password(password, hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = get_password_hash("BonMotDePasse")
    assert verify_password("MauvaisMotDePasse", hashed) is False


def test_hash_is_different_each_time_due_to_salt():
    """bcrypt utilise un sel aléatoire : deux hash du même mot de passe diffèrent."""
    password = "MemeMotDePasse"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)

    assert hash1 != hash2
    # mais les deux doivent rester valides
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True


# ---------- create_access_token ----------

def test_create_access_token_contains_correct_subject():
    token = create_access_token(subject="user@test.com")
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == "user@test.com"


def test_create_access_token_uses_default_expiration():
    """Sans expires_delta, le token doit expirer dans ACCESS_TOKEN_EXPIRE_MINUTES."""
    token = create_access_token(subject="user@test.com")
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

    # 'exp' est un timestamp Unix ; on vérifie juste qu'il est dans le futur
    # et cohérent avec la config (marge de quelques secondes pour l'exécution du test)
    import time
    expected_exp = time.time() + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    assert abs(decoded["exp"] - expected_exp) < 5


def test_create_access_token_respects_custom_expires_delta():
    token = create_access_token(subject="user@test.com", expires_delta=timedelta(minutes=1))
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

    import time
    expected_exp = time.time() + 60
    assert abs(decoded["exp"] - expected_exp) < 5


def test_create_access_token_subject_is_cast_to_string():
    """subject peut être un id numérique ; il doit être stocké en str dans 'sub'."""
    token = create_access_token(subject=42)
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == "42"


# ---------- decode_access_token ----------

def test_decode_access_token_returns_subject_for_valid_token():
    token = create_access_token(subject="user@test.com")
    subject = decode_access_token(token)
    assert subject == "user@test.com"


def test_decode_access_token_returns_none_for_invalid_token():
    assert decode_access_token("token.invalide.pastoken") is None


def test_decode_access_token_returns_none_for_expired_token():
    expired_token = create_access_token(
        subject="user@test.com",
        expires_delta=timedelta(minutes=-1),  # déjà expiré
    )
    assert decode_access_token(expired_token) is None


def test_decode_access_token_returns_none_for_wrong_secret():
    """Un token signé avec une autre clé doit être rejeté."""
    fake_token = jwt.encode(
        {"sub": "attacker@test.com"},
        "mauvaise_cle_secrete",
        algorithm=settings.JWT_ALGORITHM,
    )
    assert decode_access_token(fake_token) is None