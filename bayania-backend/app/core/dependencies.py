#cintient les dependances FastAPI reutlisable
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationException, AuthorizationException
from app.core.security import decode_access_token
from app.models.user import User
from app.models.profil import Profil
oauth2_scheme = HTTPBearer()
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    email = decode_access_token(token)
    if email is None:
        raise AuthenticationException("Could not validate credentials")
    
    # Retrieve user with profile loaded
    stmt = select(User).where(User.email == email).options(selectinload(User.profil))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise AuthenticationException("User not found")
    
    return user
    if email is None:
        raise AuthenticationException("Could not validate credentials")
    
    # Retrieve user with profile loaded
    stmt = select(User).where(User.email == email).options(selectinload(User.profil))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise AuthenticationException("User not found")
    
    return user
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.profil.type_profil
        if user_role not in self.allowed_roles:
             raise AuthorizationException(f"Role '{user_role}' is not authorized to access this resource")
        return current_user
def require_role(roles: list[str]):
    return RoleChecker(roles)