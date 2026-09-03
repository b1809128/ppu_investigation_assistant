from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import Generator, AsyncGenerator
from app.core.config import settings

# Configure engine kwargs based on DB dialect (SQLite vs MySQL)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

sync_engine_kwargs = {"echo": False}
async_engine_kwargs = {"echo": False}

if is_sqlite:
    sync_engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    sync_engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })
    async_engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })

# Create Sync SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    **sync_engine_kwargs
)

# Local sync database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Async SQLAlchemy engine
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    **async_engine_kwargs
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
