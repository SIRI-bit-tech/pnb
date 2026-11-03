from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import get_settings

settings = get_settings()

# Async Engine optimized for Neon Serverless PostgreSQL with asyncpg driver
engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    pool_recycle=300,  # Matches Neon 5-minute auto-suspend window
    connect_args={
        "statement_cache_size": 0,  # Required for Neon PgBouncer transaction pooling
        "prepared_statement_cache_size": 0,
        "ssl": "require",  # Guarantees SSL encrypted connection to Neon
        "timeout": 60,
        "command_timeout": 60,
    }
)

# Async session maker for dependency injection in routers
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides an async database session.
    Ensures that the session is closed after the request completes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
