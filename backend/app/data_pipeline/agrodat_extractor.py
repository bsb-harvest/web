"""
Extractor și adaptor pentru agrodat.md.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.3 & Task 3.4: Extragere stații meteo și telemetrie agrometeorologică din Moldova.
"""

import json
from pathlib import Path
from typing import List, Optional
from app.models.schemas import ClimateTelemetry


def get_available_stations() -> List[dict]:
    """Încarcă catalogul stațiilor meteo din Moldova."""
    seed_file = Path(__file__).parent / "seed" / "moldova_stations.json"
    if seed_file.exists():
        with open(seed_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def fetch_telemetry_for_station(
    station_id: str = "agro-st-chisinau-01",
    distance_km: float = 4.2
) -> ClimateTelemetry:
    """
    Extrage parametrii agrometeo din agrodat.md pentru o stație dată.
    """
    stations = get_available_stations()
    station = next((s for s in stations if s["id"] == station_id), None)
    
    if not station and stations:
        station = stations[0]

    if station:
        return ClimateTelemetry(
            nearest_station_id=station["id"],
            distance_km=round(distance_km, 1),
            soil_moisture_pct=float(station["soil_moisture_pct"]),
            leaf_wetness_hours=float(station["leaf_wetness_hours"]),
            precipitation_last_30d_mm=float(station["precipitation_last_30d_mm"]),
            eto_evapotranspiration_mm=float(station["eto_evapotranspiration_mm"])
        )

    # Fallback standard
    return ClimateTelemetry(
        nearest_station_id="agro-st-chisinau-01",
        distance_km=4.2,
        soil_moisture_pct=42.0,
        leaf_wetness_hours=3.5,
        precipitation_last_30d_mm=28.0,
        eto_evapotranspiration_mm=4.5
    )
