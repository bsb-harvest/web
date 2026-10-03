"""
AgriTech AI Guidance Moldova — Backend Server Entrypoint.
Persoana 2: Backend Core & Database Engineer
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.data_pipeline.worker import start_telemetry_scheduler, stop_telemetry_scheduler

logger = logging.getLogger("AppMain")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pornire scheduler periodic de telemetrie la startup-ul aplicației
    scheduler = None
    if getattr(settings, "ENABLE_SCHEDULER", True):
        try:
            scheduler = start_telemetry_scheduler()
            logger.info("APScheduler telemetrie agrodat.md inițializat cu succes în lifespan.")
        except Exception as exc:
            logger.warning(f"Nu s-a putut inițializa APScheduler la pornire: {exc}")
    yield
    # Oprire scheduler curată la shutdown
    if scheduler:
        stop_telemetry_scheduler(scheduler)
        logger.info("APScheduler oprit curat la shutdown.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API pentru AgriTech AI Guidance Moldova — Integrat cu soluri.gov.md, agrodat.md și Google Gemini.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurare CORS pentru Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Înregistrare Router v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "documentation": "/docs",
        "mock_contract": f"{settings.API_V1_STR}/mock/contract"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
