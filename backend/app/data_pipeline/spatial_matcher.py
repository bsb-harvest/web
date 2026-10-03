"""
Serviciu de potrivire spațială, calcul geometric și interpolare IDW (Inverse Distance Weighting).
Responsabilitate: Persoana 2 (Spatial GIS) & Persoana 3 (Data Pipeline)
Task 3.3: Interpolare spațială ponderată cu inversul distanței (IDW) pentru stații offline/senzori defecți.
"""

import math
import logging
from typing import List, Tuple, Dict, Any, Optional
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.data_pipeline.soluri_extractor import extract_soil_profile_by_coordinates
from app.data_pipeline.agrodat_extractor import get_available_stations, fetch_telemetry_for_station

logger = logging.getLogger("SpatialMatcher")


def calculate_polygon_centroid_and_area(coordinates: List[List[float]]) -> Tuple[float, float, float]:
    """
    Calculează centroidul [lat, lng] și suprafața aproximativă în hectare (ha)
    pentru un poligon definit prin coordonate [[lng, lat], ...].
    """
    if not coordinates or len(coordinates) < 3:
        return 47.0105, 28.8350, 10.0

    # Calcul centroid
    total_lng = sum(pt[0] for pt in coordinates)
    total_lat = sum(pt[1] for pt in coordinates)
    center_lng = total_lng / len(coordinates)
    center_lat = total_lat / len(coordinates)

    # Calcul arie cu proiecție planar-geodezică locală
    # 1 grad lat ~ 111,320 metri; 1 grad lng ~ 111,320 * cos(lat)
    lat_rad = math.radians(center_lat)
    meters_per_deg_lat = 111320.0
    meters_per_deg_lng = 111320.0 * math.cos(lat_rad)

    # Coordonate în metri relative la centroid
    pts_m = [
        ((pt[0] - center_lng) * meters_per_deg_lng, (pt[1] - center_lat) * meters_per_deg_lat)
        for pt in coordinates
    ]

    # Shoelace formula pentru suprafață în metri pătrați
    area_m2 = 0.0
    n = len(pts_m)
    for i in range(n):
        j = (i + 1) % n
        area_m2 += pts_m[i][0] * pts_m[j][1]
        area_m2 -= pts_m[j][0] * pts_m[i][1]

    area_m2 = abs(area_m2) / 2.0
    area_ha = max(0.1, round(area_m2 / 10000.0, 2))

    return center_lat, center_lng, area_ha


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculează distanța pe cercul mare în km între două puncte GPS."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def interpolate_telemetry_idw(
    lat: float,
    lng: float,
    active_stations: List[Dict[str, Any]],
    k: int = 3,
    power: float = 2.0
) -> Tuple[Dict[str, float], List[str]]:
    """
    Calculează parametrii de telemetrie lipsă prin interpolare ponderată cu inversul distanței (IDW).
    Formula ponderii: w_i = 1 / (d_i ^ power), implicit power = 2 (1 / d_i^2).

    Parametri:
    - lat, lng: Coordonatele țintă ale parcelei
    - active_stations: Lista stațiilor meteorologice active cu senzori funcționali
    - k: Numărul de stații vecine active utilizate pentru interpolare (k >= 2)
    - power: Exponentul ponderării distanței (standard IDW = 2.0)

    Returnează:
    - Dicționar cu valorile interpolate pentru parametrii meteo
    - Lista identificatorilor stațiilor vecine utilizate
    """
    if not active_stations:
        return {}, []

    # Calculare distanțe pentru toate stațiile active
    station_distances = []
    for st in active_stations:
        st_lat = float(st.get("latitude") or 47.0)
        st_lng = float(st.get("longitude") or 28.5)
        dist = haversine_distance_km(lat, lng, st_lat, st_lng)
        station_distances.append((dist, st))

    # Sortare crescătoare după distanță și selectare a celor mai apropiate k stații
    station_distances.sort(key=lambda item: item[0])
    k_effective = max(1, min(k, len(station_distances)))
    nearest_k = station_distances[:k_effective]

    used_station_ids = [st["id"] for _, st in nearest_k]

    # Parametrii meteo supuși interpolării
    params_to_interpolate = [
        "soil_moisture_pct",
        "leaf_wetness_hours",
        "precipitation_last_30d_mm",
        "eto_evapotranspiration_mm",
        "air_temp_c",
        "soil_temp_10cm_c",
        "solar_radiation_w_m2"
    ]

    interpolated_values: Dict[str, float] = {}

    for param in params_to_interpolate:
        sum_weights = 0.0
        weighted_sum = 0.0

        for dist, st in nearest_k:
            val = st.get(param)
            if val is None or (isinstance(val, float) and math.isnan(val)):
                continue

            # Evitare împărțire la zero dacă punctul este chiar pe stație
            effective_dist = max(dist, 0.01)
            weight = 1.0 / (effective_dist ** power)

            weighted_sum += weight * float(val)
            sum_weights += weight

        if sum_weights > 0:
            interpolated_values[param] = round(weighted_sum / sum_weights, 2)

    return interpolated_values, used_station_ids


def find_nearest_station_and_telemetry(
    lat: float,
    lng: float,
    stations: Optional[List[Dict[str, Any]]] = None,
    k_idw: int = 3
) -> ClimateTelemetry:
    """
    Găsește cea mai apropiată stație meteo de coordonatele date și evaluează integritatea senzorilor:
    1. Dacă cea mai apropiată stație este activă și are telemetrie completă -> folosește valorile ei directe (is_interpolated=False).
    2. DACĂ cea mai apropiată stație este OFFLINE sau are senzori defecți (valori lipsă/NaN):
       - Identifică cele mai apropiate k stații active (k >= 2).
       - Calculează parametrii lipsă prin interpolare ponderată cu inversul distanței (IDW: w_i = 1 / d_i^2).
       - Marchează telemetria cu is_interpolated = True pentru transparență în analiza agronomică.
    """
    station_list = stations if stations is not None else get_available_stations()
    if not station_list:
        return fetch_telemetry_for_station()

    # Găsește cea mai apropiată stație fizic
    closest_station = min(
        station_list,
        key=lambda s: haversine_distance_km(lat, lng, float(s["latitude"]), float(s["longitude"]))
    )
    dist = haversine_distance_km(
        lat, lng, float(closest_station["latitude"]), float(closest_station["longitude"])
    )

    # Verificare dacă stația cea mai apropiată este activă și senzorii sunt compleți
    is_active = closest_station.get("is_active", 1) == 1
    has_soil_moisture = closest_station.get("soil_moisture_pct") is not None and not (
        isinstance(closest_station.get("soil_moisture_pct"), float) and math.isnan(closest_station["soil_moisture_pct"])
    )
    has_leaf_wetness = closest_station.get("leaf_wetness_hours") is not None and not (
        isinstance(closest_station.get("leaf_wetness_hours"), float) and math.isnan(closest_station["leaf_wetness_hours"])
    )
    has_precip = closest_station.get("precipitation_last_30d_mm") is not None and not (
        isinstance(closest_station.get("precipitation_last_30d_mm"), float) and math.isnan(closest_station["precipitation_last_30d_mm"])
    )
    has_eto = closest_station.get("eto_evapotranspiration_mm") is not None and not (
        isinstance(closest_station.get("eto_evapotranspiration_mm"), float) and math.isnan(closest_station["eto_evapotranspiration_mm"])
    )

    sensors_healthy = has_soil_moisture and has_leaf_wetness and has_precip and has_eto

    # CAZ 1: Stație activă cu senzori sănătoși
    if is_active and sensors_healthy:
        return ClimateTelemetry(
            nearest_station_id=closest_station["id"],
            distance_km=round(dist, 1),
            soil_moisture_pct=float(closest_station["soil_moisture_pct"]),
            leaf_wetness_hours=float(closest_station["leaf_wetness_hours"]),
            precipitation_last_30d_mm=float(closest_station["precipitation_last_30d_mm"]),
            eto_evapotranspiration_mm=float(closest_station["eto_evapotranspiration_mm"]),
            is_interpolated=False
        )

    # CAZ 2: Stație OFFLINE sau senzori defecți -> Aplicare Interpolare IDW
    logger.info(
        f"Stația cea mai apropiată [{closest_station['id']}] este "
        f"{'offline (is_active=0)' if not is_active else 'defasată/cu senzori lipsă'}. "
        "Se inițiază interpolarea spațială IDW cu stațiile active vecine."
    )

    # Filtrare stații active cu senzori funcționali
    active_stations = [
        s for s in station_list
        if s.get("is_active", 1) == 1 and s.get("soil_moisture_pct") is not None
    ]

    # Dacă nu avem alte stații active, fallback pe prima disponibilă sau valori standard
    if not active_stations:
        return fetch_telemetry_for_station(closest_station["id"], distance_km=dist)

    interpolated, used_ids = interpolate_telemetry_idw(
        lat, lng, active_stations, k=k_idw, power=2.0
    )

    soil_moisture = interpolated.get(
        "soil_moisture_pct",
        float(closest_station.get("soil_moisture_pct") or 40.0)
    )
    leaf_wetness = interpolated.get(
        "leaf_wetness_hours",
        float(closest_station.get("leaf_wetness_hours") or 2.5)
    )
    precip = interpolated.get(
        "precipitation_last_30d_mm",
        float(closest_station.get("precipitation_last_30d_mm") or 25.0)
    )
    eto = interpolated.get(
        "eto_evapotranspiration_mm",
        float(closest_station.get("eto_evapotranspiration_mm") or 4.0)
    )

    logger.info(
        f"IDW finalizat pentru coordonatele ({lat}, {lng}): folosit stațiile {used_ids}. "
        f"Umiditate sol={soil_moisture}%, Precipitații={precip} mm, ETo={eto} mm/zi."
    )

    return ClimateTelemetry(
        nearest_station_id=closest_station["id"],
        distance_km=round(dist, 1),
        soil_moisture_pct=soil_moisture,
        leaf_wetness_hours=leaf_wetness,
        precipitation_last_30d_mm=precip,
        eto_evapotranspiration_mm=eto,
        is_interpolated=True
    )


def match_parcel_environment(coordinates: List[List[float]]) -> Tuple[SoilProfile, ClimateTelemetry, float]:
    """
    Intersecție completă: poligon parcelă -> profil sol + telemetrie stație apropiată (sau IDW) + suprafață ha.
    """
    lat, lng, area_ha = calculate_polygon_centroid_and_area(coordinates)
    soil = extract_soil_profile_by_coordinates(lat, lng)
    climate = find_nearest_station_and_telemetry(lat, lng)
    return soil, climate, area_ha
