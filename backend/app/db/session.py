import os
import ssl
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Configurare URL conexiune sigură SSL (Aiven Cloud & CA Certificate)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if "?sslmode=" in db_url:
    db_url = db_url.split("?sslmode=")[0]
elif "&sslmode=" in db_url:
    db_url = db_url.split("&sslmode=")[0]


def _build_connect_args() -> dict:
    ca_path = None
    if settings.DB_SSL_CA_PATH:
        candidate = Path(settings.DB_SSL_CA_PATH)
        ca_path = candidate if candidate.is_absolute() else (BACKEND_ROOT / candidate)
        if not ca_path.exists():
            ca_path = None
    else:
        ca_candidates = [
            Path("ca.pem"),
            Path("backend/ca.pem"),
            BACKEND_ROOT / "ca.pem",
            BACKEND_ROOT.parent / "ca.pem",
        ]
        found = next((p for p in ca_candidates if p.exists()), None)
        if found and ("aivencloud.com" in db_url or "ssl" in db_url):
            ca_path = found

    # Dacă avem fișier CA, îl folosim
    if ca_path and ca_path.exists():
        ssl_ctx = ssl.create_default_context(cafile=str(ca_path))
        ssl_ctx.check_hostname = False
        return {"ssl": ssl_ctx}

    # Dacă suntem pe Aiven Cloud dar ca.pem nu este pe disc, folosim conexiune SSL fără verificare strictă de CA
    if "aivencloud.com" in db_url or "sslmode=require" in settings.DATABASE_URL:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        return {"ssl": ssl_ctx}

    return {}


engine = create_async_engine(
    db_url,
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
