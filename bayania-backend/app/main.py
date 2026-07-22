import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import limiter
from app.models.profil import Profil
from app.routers import auth, questions, sources, admin
from app.routers import users
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



async def seed_profiles():
    """
    Seeds the DB with default profiles if they don't exist yet.
    """
    logger.info("Checking and seeding default profiles...")
    try:
        async with AsyncSessionLocal() as session:
            for type_profil in ["normal", "professionnel", "administrateur"]:
                stmt = select(Profil).where(Profil.type_profil == type_profil)
                result = await session.execute(stmt)
                profil = result.scalar_one_or_none()
                if not profil:
                    logger.info(f"Seeding profile type: {type_profil}")
                    session.add(Profil(type_profil=type_profil))
            await session.commit()
    except Exception as e:
        logger.error(f"Error seeding default profiles: {str(e)}")
        
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database seeds
    await seed_profiles()
    yield
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend de la plateforme d'assistance juridique intelligente (BayanIA)",
    version="1.0.0",
    lifespan=lifespan
)
# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# SlowAPI Rate Limiter state and handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# Centralized exception handlers registration
register_exception_handlers(app)
# Include routers
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(sources.router)
app.include_router(admin.router)
app.include_router(users.router)
@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "env": settings.ENV
    }