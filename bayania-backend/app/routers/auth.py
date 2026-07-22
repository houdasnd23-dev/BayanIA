from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, Token
from app.services.auth_service import AuthService
router = APIRouter(prefix="/auth", tags=["Authentication"])
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    return await AuthService.register_user(db, user_in)
@router.post("/login", response_model=Token)
async def login(login_in: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.login_user(db, login_in)