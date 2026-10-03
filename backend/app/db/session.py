

import ssl
from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.core.config import settings

Base = declarative_base()

# backend/  (app/db/session.py -> app/db -> app -> backend)
BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _build_connect_args() -> dict:
   
    if not settings.DB_SSL_CA_PATH:
        return {}

    ca_path = Path(settings.DB_SSL_CA_PATH)
    if not ca_path.is_absolute():
        ca_path = BACKEND_ROOT / ca_path

    if not ca_path.exists():
        raise FileNotFoundError(
            f"Certificatul CA nu a fost gasit: {ca_path}. "
            "Verifica DB_SSL_CA_PATH din .env sau goleste-l pentru conexiune locala fara TLS."
        )

    return {"ssl": ssl.create_default_context(cafile=str(ca_path))}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,          
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=1800,           
    connect_args=_build_connect_args(),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
