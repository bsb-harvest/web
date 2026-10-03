"""
PostgreSQL & PostGIS Database Engine and Session management.
Persoana 2: Backend Core & Database Engineer
"""

import os
import ssl
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

# Configurare conexiune sigură SSL (Aiven Cloud & CA Certificate)
ssl_connect_args = {}
ca_candidates = [
    Path("ca.pem"),
    Path("backend/ca.pem"),
    Path(__file__).resolve().parent.parent.parent / "ca.pem",
]
ca_file = next((p for p in ca_candidates if p.exists()), None)

db_url = settings.DATABASE_URL

# Asigurare driver asyncpg
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Curățare parametri libpq neacceptați direct de asyncpg
if "?sslmode=" in db_url:
    db_url = db_url.split("?sslmode=")[0]
elif "&sslmode=" in db_url:
    db_url = db_url.split("&sslmode=")[0]

if ca_file and ("aivencloud.com" in db_url or "ssl" in db_url):
    ssl_ctx = ssl.create_default_context(cafile=str(ca_file))
    ssl_ctx.check_hostname = False
    ssl_connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=ssl_connect_args
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
