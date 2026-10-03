"""
Rute pentru telemetrie agrometeorologică (agrodat.md).
"""

from typing import List
from fastapi import APIRouter, Query
from app.models.schemas import ClimateTelemetry
from app.data_pipeline.agrodat_extractor import get_available_stations, fetch_telemetry_for_station
from app.data_pipeline.spatial_matcher import find_nearest_station_and_telemetry

router = APIRouter()


@router.get("/telemetry", response_model=ClimateTelemetry, summary="Obține telemetrie pentru coordonate GPS")
async def get_weather_telemetry(
    lat: float = Query(47.01, description="Latitudine"),
    lng: float = Query(28.83, description="Longitudine")
):
    """Găsește cea mai apropiată stație și extrage telemetria meteo actuală."""
    return find_nearest_station_and_telemetry(lat, lng)


@router.get("/stations", summary="Lista stațiilor agrometeo din Republica Moldova")
async def list_weather_stations():
    """Returnează rețeaua de stații meteorologice disponibile."""
    return get_available_stations()
