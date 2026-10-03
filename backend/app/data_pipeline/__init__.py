"""
Pachetul Data Pipeline — Extragere soluri.gov.md și agrodat.md.
Persoana 3: Data Engineer & Integration Specialist
"""

from app.data_pipeline.agrodat_extractor import fetch_telemetry_for_station, get_available_stations
from app.data_pipeline.soluri_extractor import extract_soil_profile_by_coordinates
from app.data_pipeline.spatial_matcher import match_parcel_environment, calculate_polygon_centroid_and_area
from app.data_pipeline.worker import run_sync_cycle

__all__ = [
    "fetch_telemetry_for_station",
    "get_available_stations",
    "extract_soil_profile_by_coordinates",
    "match_parcel_environment",
    "calculate_polygon_centroid_and_area",
    "run_sync_cycle",
]
