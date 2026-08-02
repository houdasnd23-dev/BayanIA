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
from app.routers import auth, questions, sources, admin, documents
from app.routers import users


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_profiles():
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
# Includes: Next.js desktop frontend, Android emulator, Expo Go, physical device on LAN
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    "http://10.0.2.2:3000",
    "http://10.0.2.2:8081",
    "http://192.168.1.15:3000",
    "http://192.168.1.15:8081",
    "https://bayan-ia-eight.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
app.include_router(documents.router)


@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "env": settings.ENV
    }