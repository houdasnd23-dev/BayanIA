from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.core.exceptions import (
    AuthenticationException,
    InvalidRequestException,
)
from app.models.user import User
from app.models.profil import Profil
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest, Token


async def get_or_create_profil(db: AsyncSession, type_profil: str) -> Profil:
    stmt = select(Profil).where(Profil.type_profil == type_profil)
    result = await db.execute(stmt)
    profil = result.scalar_one_or_none()

    if not profil:
        profil = Profil(type_profil=type_profil)
        db.add(profil)
        await db.commit()
        await db.refresh(profil)

    return profil


class AuthService:

    @staticmethod
    async def register_user(db: AsyncSession, user_in: UserCreate) -> User:
        stmt = select(User).where(User.email == user_in.email)
        result = await db.execute(stmt)

        if result.scalar_one_or_none():
            raise InvalidRequestException("Email already registered")

        # SÉCURITÉ : "administrateur" est explicitement exclu des rôles
        # attribuables via l'inscription publique. Un compte admin ne peut
        # être créé que manuellement (SQL direct ou futur endpoint admin
        # protégé), jamais par auto-inscription.
        profil_type = user_in.type_profil.lower()

        if profil_type not in ["normal", "professionnel"]:
            raise InvalidRequestException("Invalid profile type.")

        profil = await get_or_create_profil(db, profil_type)

        hashed_password = get_password_hash(user_in.mot_de_passe)

        db_user = User(
            nom_user=user_in.nom_user,
            email=user_in.email,
            mot_de_passe=hashed_password,
            id_profil=profil.id_profil,
        )

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

        stmt = (
            select(User)
            .where(User.id_user == db_user.id_user)
            .options(selectinload(User.profil))
        )

        result = await db.execute(stmt)

        return result.scalar_one()

    @staticmethod
    async def login_user(
        db: AsyncSession,
        login_in: LoginRequest,
    ) -> Token:

        stmt = select(User).where(User.email == login_in.email)
        result = await db.execute(stmt)

        user = result.scalar_one_or_none()

        if (
            not user
            or not verify_password(
                login_in.mot_de_passe,
                user.mot_de_passe,
            )
        ):
            raise AuthenticationException(
                "Incorrect email or password"
            )

        access_token = create_access_token(subject=user.email)

        return Token(access_token=access_token)