import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models.profil import Profil
# Use SQLite in-memory for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Creates a fresh in-memory SQLite database, runs migrations,
     seeds default profiles, and yields a session.
    """
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    AsyncSessionTesting = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed profiles
    async with AsyncSessionTesting() as session:
        for type_profil in ["normal", "professionnel", "administrateur"]:
            session.add(Profil(type_profil=type_profil))
        await session.commit()
        
    async with AsyncSessionTesting() as session:
        yield session
        
    async with engine.begin() as conn:
        # Drop all tables after test
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """
    Dependency overrides and client fixture for testing.
    """
    async def _get_test_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = _get_test_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()
    