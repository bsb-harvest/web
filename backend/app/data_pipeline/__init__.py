"""
Pachetul Data Pipeline — Extragere soluri.gov.md și agrodat.md.
Persoana 3: Data Engineer & Integration Specialist
"""

from app.data_pipeline.agrodat_extractor import (
    fetch_telemetry_for_station,
    get_available_stations,
    sync_telemetry_to_database,
    sync_telemetry_to_database_sync,
    normalize_station_telemetry,
    evaluate_station_activity,
    fetch_live_agrodat_data,
    load_fallback_stations,
)
from app.data_pipeline.soluri_extractor import (
    extract_soil_profile_by_coordinates,
    clean_soil_record,
    get_soil_features,
    load_seed_soil_features,
    fetch_wfs_soil_features,
)
from app.data_pipeline.spatial_matcher import (
    match_parcel_environment,
    calculate_polygon_centroid_and_area,
    find_nearest_station_and_telemetry,
    interpolate_telemetry_idw,
    haversine_distance_km,
)
from app.data_pipeline.worker import (
    run_sync_cycle,
    start_telemetry_scheduler,
    stop_telemetry_scheduler,
    scheduled_telemetry_sync_cycle,
    validate_station_sensors,
)
from app.data_pipeline.import_soils import import_soils_to_db

__all__ = [
    "fetch_telemetry_for_station",
    "get_available_stations",
    "sync_telemetry_to_database",
    "sync_telemetry_to_database_sync",
    "normalize_station_telemetry",
    "evaluate_station_activity",
    "fetch_live_agrodat_data",
    "load_fallback_stations",
    "extract_soil_profile_by_coordinates",
    "clean_soil_record",
    "get_soil_features",
    "load_seed_soil_features",
    "fetch_wfs_soil_features",
    "match_parcel_environment",
    "calculate_polygon_centroid_and_area",
    "find_nearest_station_and_telemetry",
    "interpolate_telemetry_idw",
    "haversine_distance_km",
    "run_sync_cycle",
    "start_telemetry_scheduler",
    "stop_telemetry_scheduler",
    "scheduled_telemetry_sync_cycle",
    "validate_station_sensors",
    "import_soils_to_db",
]
