import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.agronomic_engine.calculator import calculate_crop_economics
from app.ai_service.gemini_client import ai_service
from app.data_pipeline.agrodat_extractor import fetch_telemetry_for_station
from app.data_pipeline.soluri_extractor import extract_soil_profile_by_coordinates
from app.db.gis_queries import (
    StationMatch,
    calculate_area_ha,
    coords_to_wkt,
    find_dominant_soil,
    find_nearest_station,
)
from app.db.session import get_db
from app.models.schemas import (
    AIGuidance,
    ClimateTelemetry,
    ParcelAnalysisResponse,
    ParcelAnalyzeRequest,
    SoilProfile,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Peste acest prag, datele statiei descriu tot mai putin parcela reala.
MAX_RELEVANT_STATION_KM = 30.0

# Telemetrie mai veche de atat inseamna statie care nu mai transmite.
MAX_TELEMETRY_AGE = timedelta(hours=24)

# Gemini raspunde de obicei in cateva secunde; peste atat renuntam si livram
# rezultatul determinist, in loc sa tinem fermierul in asteptare.
AI_TIMEOUT_SECONDS = 25.0


def _centroid(coordinates: List[List[float]]) -> Tuple[float, float]:
    """Centrul aproximativ al poligonului, pentru estimarile de rezerva."""
    lat = sum(p[1] for p in coordinates) / len(coordinates)
    lng = sum(p[0] for p in coordinates) / len(coordinates)
    return lat, lng


async def _resolve_soil(
    db: AsyncSession, coordinates: List[List[float]], warnings: List[str]
) -> SoilProfile:
   
    match = await find_dominant_soil(db, coordinates)

    if match is None:
        lat, lng = _centroid(coordinates)
        warnings.append(
            "Profil de sol ESTIMAT pe baza zonei pedologice: parcela nu are "
            "acoperire in harta solurilor."
        )
        return extract_soil_profile_by_coordinates(lat, lng)

    if match.coverage_pct < 95.0:
        warnings.append(
            f"Acoperire pedologica partiala: {match.coverage_pct}% din parcela. "
            "Indicatorii sunt mediati doar pe suprafata cunoscuta."
        )

    if match.components > 1:
        warnings.append(
            f"Parcela traverseaza {match.components} tipuri de sol; bonitatea, "
            "humusul si pH-ul sunt medii ponderate pe suprafata."
        )

    return match.profile


async def _resolve_climate(
    db: AsyncSession, coordinates: List[List[float]], warnings: List[str]
) -> ClimateTelemetry:
    """Telemetria celei mai apropiate statii active, cu avertismente de calitate."""
    match: Optional[StationMatch] = await find_nearest_station(db, coordinates)

    if match is None:
        warnings.append(
            "Nicio statie agro-meteo activa in baza de date; s-au folosit valori de referinta."
        )
        return fetch_telemetry_for_station()

    if match.telemetry.distance_km > MAX_RELEVANT_STATION_KM:
        warnings.append(
            f"Cea mai apropiata statie ({match.station_name}) este la "
            f"{match.telemetry.distance_km} km — relevanta datelor meteo este redusa."
        )

    if match.recorded_at is None:
        warnings.append(
            f"Statia {match.station_name} nu a transmis nicio masuratoare."
        )
    else:
        # recorded_at vine fara fus orar din baza de date; il tratam ca UTC.
        recorded_at = match.recorded_at
        if recorded_at.tzinfo is None:
            recorded_at = recorded_at.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - recorded_at
        if age > MAX_TELEMETRY_AGE:
            warnings.append(
                f"Telemetrie veche de {int(age.total_seconds() // 3600)} ore "
                f"(statia {match.station_name})."
            )

    return match.telemetry


async def _resolve_ai_guidance(soil, climate, crops, area_ha, warnings: List[str]) -> AIGuidance:
    """
    Sinteza agronomica a stratului AI (P5), izolata de restul fluxului.

    Doua masuri: apelul merge in threadpool, fiindca generate_guidance este
    sincron si ar bloca bucla de evenimente pentru toti utilizatorii cat dureaza
    raspunsul Gemini; si are timeout, ca o latenta externa sa nu tina endpoint-ul
    ocupat la nesfarsit. Orice esec devine avertisment, nu eroare HTTP.
    """
    try:
        return await asyncio.wait_for(
            run_in_threadpool(
                ai_service.generate_guidance,
                soil=soil,
                climate=climate,
                crops=crops,
                area_ha=area_ha,
            ),
            timeout=AI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Serviciul AI a depasit %.0f s; se livreaza rezultatul determinist.", AI_TIMEOUT_SECONDS)
        warnings.append("Sinteza AI indisponibila (timp de raspuns depasit).")
    except Exception as exc:  # noqa: BLE001 — orice eroare a AI-ului este tolerata
        logger.warning("Serviciul AI a esuat: %s", exc)
        warnings.append("Sinteza AI indisponibila (eroare a serviciului).")

    return AIGuidance(
        summary=(
            "Comentariul agronomic generat de AI nu este disponibil momentan. "
            "Suprafata, profilul de sol, randamentele estimate si devizul de "
            "costuri de mai jos sunt calculate determinist si raman valabile."
        ),
        risks=[],
        actionable_steps=[],
    )


async def _persist_parcel(
    db: AsyncSession,
    parcel_id: str,
    request: ParcelAnalyzeRequest,
    area_ha: float,
    warnings: List[str],
) -> None:
    """
    Salveaza parcela analizata, ca geometrie, nu ca lista de numere.

    Esecul salvarii nu invalideaza analiza: fermierul are deja raspunsul corect
    in fata, deci il livram si doar semnalam ca nu a fost memorat.
    """
    try:
        await db.execute(
            text("""
                INSERT INTO parcels
                    (id, user_id, name, cadastral_number, area_hectares, geom, created_at)
                VALUES (
                    CAST(:pid AS uuid), :user_id, :name, :cadastral, :area,
                    ST_GeomFromText(:wkt, 4326), NOW()
                )
            """),
            {
                "pid": parcel_id,
                "user_id": request.user_id,
                "name": request.parcel_name or "Parcela mea",
                "cadastral": request.cadastral_code,
                "area": area_ha,
                "wkt": coords_to_wkt(request.coordinates),
            },
        )
        await db.commit()
    except Exception as exc:  # noqa: BLE001
        await db.rollback()
        logger.warning("Parcela nu a putut fi salvata: %s", exc)
        warnings.append("Parcela nu a putut fi salvata in baza de date.")


@router.post(
    "/analyze",
    response_model=ParcelAnalysisResponse,
    summary="Analiza completa parcela (GIS + Bonitate + Finante + AI)",
)
async def analyze_parcel(
    request: ParcelAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpointul cheie al platformei.

    1. Calculeaza aria reala (PostGIS, pe elipsoid), profilul de sol predominant
       prin intersectie spatiala si cea mai apropiata statie agro-meteo activa.
    2. Ruleaza motorul agronomic determinist (P4): randament t/ha, deviz MDL/ha
       si profit net pentru culturile din catalog.
    3. Trimite cifrele deja calculate catre stratul AI (P5) pentru sinteza si
       riscuri fitosanitare.

    Pasii 1-2 nu depind de pasul 3. Campul "warnings" descrie calitatea datelor.
    """
    warnings: List[str] = []

    # 1. Geometrie si mediu pedoclimatic.
    try:
        area_ha = await calculate_area_ha(db, request.coordinates)
    except ValueError as exc:
        # Poligon invalid primit de la client: eroare de cerere, nu de server.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    soil = await _resolve_soil(db, request.coordinates, warnings)
    climate = await _resolve_climate(db, request.coordinates, warnings)

    # 2. Calcule deterministe (P4). Daca acestea esueaza, raspunsul nu are valoare.
    try:
        recommended_crops = await run_in_threadpool(
            calculate_crop_economics, soil=soil, climate=climate
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Motorul agronomic a esuat")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la calculul agronomic: {exc}",
        ) from exc

    # 3. Sinteza AI (P5) — optionala prin constructie.
    ai_guidance = await _resolve_ai_guidance(soil, climate, recommended_crops, area_ha, warnings)

    parcel_id = str(uuid.uuid4())
    await _persist_parcel(db, parcel_id, request, area_ha, warnings)

    return ParcelAnalysisResponse(
        parcel_id=parcel_id,
        cadastral_code=request.cadastral_code,
        area_ha=area_ha,
        coordinates=request.coordinates,
        soil_profile=soil,
        climate_telemetry=climate,
        recommended_crops=recommended_crops,
        ai_guidance=ai_guidance,
        warnings=warnings,
    )
