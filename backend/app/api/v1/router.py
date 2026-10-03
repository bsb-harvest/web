"""
Master API Router pentru v1.
Persoana 2: Backend Core Engineer
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    mock,
    parcels,
    soils,
    weather,
    crops,
    chat,
    reports
)

api_router = APIRouter()

# Rute Mock (Zero-blocking Day 1)
api_router.include_router(mock.router, prefix="/mock", tags=["00. Mock (Zero-Blocking Day 1)"])

# Rute de bază producție
api_router.include_router(parcels.router, prefix="/parcels", tags=["01. Parcele & Analiză"])
api_router.include_router(crops.router, prefix="/crops", tags=["02. Culturi Agricole"])
api_router.include_router(soils.router, prefix="/soils", tags=["03. Date Pedologice (soluri.gov.md)"])
api_router.include_router(weather.router, prefix="/weather", tags=["04. Telemetrie Agrometeo (agrodat.md)"])
api_router.include_router(chat.router, prefix="/chat", tags=["05. Asistent Conversațional AI"])
api_router.include_router(reports.router, prefix="/reports", tags=["06. Rapoarte Executive"])
