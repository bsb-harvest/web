"""
Rute pentru date pedologice (soluri.gov.md).
"""

from fastapi import APIRouter, Query
from app.models.schemas import SoilProfile
from app.data_pipeline.soluri_extractor import extract_soil_profile_by_coordinates

router = APIRouter()


@router.get("/lookup", response_model=SoilProfile, summary="Caută profilul de sol după coordonate GPS")
async def lookup_soil(
    lat: float = Query(..., description="Latitudine (ex: 47.01)"),
    lng: float = Query(..., description="Longitudine (ex: 28.83)")
):
    """Interoghează baza de date pedologică a solurilor din Republica Moldova."""
    return extract_soil_profile_by_coordinates(lat, lng)
