from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the profile of the currently authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the profile of the currently authenticated user.
    """
    if user_update.nom_user is not None:
        current_user.nom_user = user_update.nom_user
    if user_update.email is not None:
        current_user.email = user_update.email

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user