from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import ClimateTelemetry, SoilProfile


MD_LNG_MIN, MD_LNG_MAX = 26.0, 30.5
MD_LAT_MIN, MD_LAT_MAX = 45.0, 48.6

EROSION_GRADES = {"lipsa", "slab", "moderat", "puternic"}


@dataclass
class SoilMatch:
    """Rezultatul intersectiei cu harta pedologica."""
    profile: SoilProfile
    coverage_pct: float   
    components: int       


@dataclass
class StationMatch:
    """Statia cea mai apropiata, impreuna cu ultima ei telemetrie."""
    telemetry: ClimateTelemetry
    station_name: str
    recorded_at: Optional[datetime]   # None daca statia nu a transmis niciodata


def _f(value) -> float:

    if value is None:
        return 0.0
    return float(value) if isinstance(value, Decimal) else float(value)


def coords_to_wkt(coordinates: List[List[float]]) -> str:
    """
    Transforma [[lng, lat], ...] (formatul trimis de harta din frontend) in WKT POLYGON.

    """
    if not coordinates or len(coordinates) < 3:
        raise ValueError("Poligonul parcelei are nevoie de cel putin 3 puncte.")

    pts = [(float(p[0]), float(p[1])) for p in coordinates]

    for lng, lat in pts:
        if not (MD_LNG_MIN <= lng <= MD_LNG_MAX and MD_LAT_MIN <= lat <= MD_LAT_MAX):
            raise ValueError(
                f"Punct in afara Republicii Moldova: lng={lng}, lat={lat}. "
                "Verifica ordinea coordonatelor — se asteapta [lng, lat]."
            )

    if pts[0] != pts[-1]:
        pts.append(pts[0])

    if len(pts) < 4:
        raise ValueError("Poligon degenerat: puncte insuficiente dupa inchiderea inelului.")

    ring = ", ".join(f"{lng} {lat}" for lng, lat in pts)
    return f"POLYGON(({ring}))"


async def calculate_area_ha(session: AsyncSession, coordinates: List[List[float]]) -> float:
    """Suprafata parcelei in hectare, calculata pe elipsoid (nu pe grade)."""
    wkt = coords_to_wkt(coordinates)
    result = await session.execute(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography) / 10000.0"),
        {"wkt": wkt},
    )
    return round(_f(result.scalar()), 2)


async def find_dominant_soil(
    session: AsyncSession, coordinates: List[List[float]]
) -> Optional[SoilMatch]:
    wkt = coords_to_wkt(coordinates)

    rows = (await session.execute(
        text("""
            WITH p AS (SELECT ST_GeomFromText(:wkt, 4326) AS geom)
            SELECT
                s.soil_type,
                s.bonitate_score,
                s.humus_percentage,
                s.ph_level,
                s.erosion_grade,
                ST_Area(ST_Intersection(s.geom, p.geom)::geography) AS overlap_m2
            FROM soil_profiles s, p
            WHERE s.geom IS NOT NULL
              AND ST_Intersects(s.geom, p.geom)
            ORDER BY overlap_m2 DESC
        """),
        {"wkt": wkt},
    )).mappings().all()

    if not rows:
        return None

    total_overlap = sum(_f(r["overlap_m2"]) for r in rows)
    if total_overlap <= 0:
        return None

    # Media ponderata pe suprafata pentru indicatorii numerici.
    bonitate = sum(_f(r["bonitate_score"]) * _f(r["overlap_m2"]) for r in rows) / total_overlap
    humus = sum(_f(r["humus_percentage"]) * _f(r["overlap_m2"]) for r in rows) / total_overlap
    ph = sum(_f(r["ph_level"]) * _f(r["overlap_m2"]) for r in rows) / total_overlap

    dominant = rows[0]
    erosion = (dominant["erosion_grade"] or "slab").strip().lower()
    if erosion not in EROSION_GRADES:
        erosion = "slab"

    parcel_m2 = _f((await session.execute(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography)"),
        {"wkt": wkt},
    )).scalar())

    coverage = min(100.0, total_overlap / parcel_m2 * 100.0) if parcel_m2 else 0.0

    profile = SoilProfile(
        type=dominant["soil_type"],
        bonitate_points=max(1, min(100, round(bonitate))),
        humus_pct=round(humus, 2),
        ph=round(ph, 1),
        erosion_grade=erosion,
    )

    return SoilMatch(profile=profile, coverage_pct=round(coverage, 1), components=len(rows))


async def find_nearest_station(
    session: AsyncSession, coordinates: List[List[float]]
) -> Optional[StationMatch]:
    wkt = coords_to_wkt(coordinates)

    station = (await session.execute(
        text("""
            WITH p AS (SELECT ST_Centroid(ST_GeomFromText(:wkt, 4326)) AS c)
            SELECT
                w.id,
                w.name,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326)::geography,
                    p.c::geography
                ) / 1000.0 AS distance_km
            FROM weather_stations w, p
            WHERE w.is_active = 1
            ORDER BY ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326) <-> p.c
            LIMIT 1
        """),
        {"wkt": wkt},
    )).mappings().first()

    if not station:
        return None

    latest = (await session.execute(
        text("""
            SELECT
                t.recorded_at,
                t.soil_moisture_percentage,
                t.leaf_wetness_minutes,
                t.et0_evapotranspiration_mm,
                t.precipitation_mm AS precipitation_30d_mm
            FROM agro_weather_telemetry t
            WHERE t.station_id = :station_id
            ORDER BY t.recorded_at DESC
            LIMIT 1
        """),
        {"station_id": station["id"]},
    )).mappings().first()

    distance_km = round(_f(station["distance_km"]), 2)

    if latest is None:
        # Statia exista, dar nu a transmis niciodata. Valori neutre; lipsa
        # prospetimii (recorded_at = None) permite API-ului sa avertizeze.
        telemetry = ClimateTelemetry(
            nearest_station_id=station["id"],
            distance_km=distance_km,
            soil_moisture_pct=0.0,
            leaf_wetness_hours=0.0,
            precipitation_last_30d_mm=0.0,
            eto_evapotranspiration_mm=0.0,
        )
        return StationMatch(telemetry=telemetry, station_name=station["name"], recorded_at=None)

    telemetry = ClimateTelemetry(
        nearest_station_id=station["id"],
        distance_km=distance_km,
        soil_moisture_pct=round(_f(latest["soil_moisture_percentage"]), 1),
        leaf_wetness_hours=round(_f(latest["leaf_wetness_minutes"]) / 60.0, 1),
        precipitation_last_30d_mm=round(_f(latest["precipitation_30d_mm"]), 1),
        eto_evapotranspiration_mm=round(_f(latest["et0_evapotranspiration_mm"]), 2),
    )

    return StationMatch(
        telemetry=telemetry,
        station_name=station["name"],
        recorded_at=latest["recorded_at"],
    )
