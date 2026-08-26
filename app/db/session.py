from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import Generator, AsyncGenerator
from app.core.config import settings

# Create Sync SQLAlchemy engine (supporting connection pool)
# pool_size specifies the number of connections to keep in the pool.
# max_overflow specifies how many connections can be opened beyond pool_size.
# pool_pre_ping checks connections for liveness before executing queries.
# pool_recycle recycles connections every hour to prevent MySQL stale connection errors.
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Local sync database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Async SQLAlchemy engine (supporting connection pool)
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Local async database session factory
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional sync database session.
    Closes the session automatically once the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a transactional async database session.
    Closes the session automatically once the request completes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
