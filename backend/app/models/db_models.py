"""
Tabele PostGIS pentru AgriTech AI Guidance Moldova.
Persoana 2: Backend Core & Database Engineer
Task 2.3: Definire tabele parcels, soil_profiles, weather_stations, agro_weather_telemetry.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Numeric, Integer, DateTime, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False


class Parcel(Base):
    """Parcelele fermierului (poligoane cadastrale sau trasate manual)"""
    __tablename__ = "parcels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=True)
    name = Column(String(150), default="Parcela agricola")
    cadastral_number = Column(String(50), nullable=True, index=True)
    area_hectares = Column(Numeric(10, 2), nullable=False)
    
    # Daca PostGIS este instalat se foloseste Geometry(Polygon, 4326), altfel reprezentare text WKT/GeoJSON
    if HAS_GEOALCHEMY:
        geom = Column(Geometry("POLYGON", srid=4326), nullable=True)
    geom_wkt = Column(String, nullable=True)
        
    created_at = Column(DateTime, default=datetime.utcnow)


class SoilProfileRecord(Base):
    """Harta pedologica a solurilor din Moldova (soluri.gov.md)"""
    __tablename__ = "soil_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    soil_type = Column(String(150), nullable=False)
    bonitate_score = Column(Integer, nullable=False)  # 1 - 100 puncte
    humus_percentage = Column(Numeric(4, 2), nullable=False)
    ph_level = Column(Numeric(3, 1), nullable=False)
    erosion_grade = Column(String(50), default="slab")
    
    if HAS_GEOALCHEMY:
        geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)
    geom_wkt = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class WeatherStation(Base):
    """Reteaua de statii agro-meteorologice (agrodat.md)"""
    __tablename__ = "weather_stations"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    latitude = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    elevation_m = Column(Integer, nullable=True)
    is_active = Column(Integer, default=1)


class WeatherTelemetryRecord(Base):
    """Telemetrie dinamica de la statiile meteo agrodat.md"""
    __tablename__ = "agro_weather_telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(50), ForeignKey("weather_stations.id"), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    air_temp_c = Column(Numeric(4, 1))
    soil_temp_10cm_c = Column(Numeric(4, 1))
    soil_moisture_percentage = Column(Numeric(5, 2))
    leaf_wetness_minutes = Column(Integer)
    solar_radiation_w_m2 = Column(Numeric(6, 2))
    precipitation_mm = Column(Numeric(5, 1))
    et0_evapotranspiration_mm = Column(Numeric(5, 2))
