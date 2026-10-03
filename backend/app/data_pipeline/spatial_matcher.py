"""
Serviciu de potrivire spațială și calcul geometric.
Responsabilitate: Persoana 2 (Spatial GIS) & Persoana 3 (Data Pipeline)
"""

import math
from typing import List, Tuple
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.data_pipeline.soluri_extractor import extract_soil_profile_by_coordinates
from app.data_pipeline.agrodat_extractor import get_available_stations, fetch_telemetry_for_station


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


def find_nearest_station_and_telemetry(lat: float, lng: float) -> ClimateTelemetry:
    """Găsește cea mai apropiată stație meteo de coordonatele date."""
    stations = get_available_stations()
    if not stations:
        return fetch_telemetry_for_station()

    closest_station = min(
        stations,
        key=lambda s: haversine_distance_km(lat, lng, float(s["latitude"]), float(s["longitude"]))
    )
    dist = haversine_distance_km(lat, lng, float(closest_station["latitude"]), float(closest_station["longitude"]))

    return fetch_telemetry_for_station(closest_station["id"], distance_km=dist)


def match_parcel_environment(coordinates: List[List[float]]) -> Tuple[SoilProfile, ClimateTelemetry, float]:
    """
    Intersecție completă: poligon parcelă -> profil sol + telemetrie stație apropiată + suprafață ha.
    """
    lat, lng, area_ha = calculate_polygon_centroid_and_area(coordinates)
    soil = extract_soil_profile_by_coordinates(lat, lng)
    climate = find_nearest_station_and_telemetry(lat, lng)
    return soil, climate, area_ha
