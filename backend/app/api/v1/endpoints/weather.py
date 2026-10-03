import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_pipeline.agrodat_extractor import fetch_telemetry_for_station, get_available_stations
from app.db.gis_queries import find_nearest_station_by_point, list_active_stations
from app.db.session import get_db
from app.models.schemas import ClimateTelemetry

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/telemetry",
    response_model=ClimateTelemetry,
    summary="Obtine telemetrie pentru coordonate GPS",
)
async def get_weather_telemetry(
    lat: float = Query(47.01, description="Latitudine"),
    lng: float = Query(28.83, description="Longitudine"),
    db: AsyncSession = Depends(get_db),
):
    """
    Gaseste cea mai apropiata statie activa (interogare spatiala KNN) si
    intoarce ultima ei masuratoare.
    """
    try:
        match = await find_nearest_station_by_point(db, lat=lat, lng=lng)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    if match is None:
        # Nicio statie activa in baza de date: pastram endpoint-ul utilizabil
        # cu valori de referinta, in loc sa intoarcem eroare.
        logger.warning("Nicio statie activa in baza de date; se folosesc valori de referinta.")
        return fetch_telemetry_for_station()

    return match.telemetry


@router.get("/stations", summary="Lista statiilor agrometeo din Republica Moldova")
async def list_weather_stations(db: AsyncSession = Depends(get_db)) -> List[dict]:
    """
    Reteaua de statii din baza de date, cu marcajul ultimei masuratori primite
    de la fiecare — util ca Persoana 1 sa poata afisa pe harta care statii mai
    transmit si care au amutit.
    """
    stations = await list_active_stations(db)

    if not stations:
        logger.warning("Tabelul weather_stations este gol; se returneaza catalogul seed.")
        return get_available_stations()

    return stations
