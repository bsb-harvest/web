"""
Teste unitare și de integrare pentru Task 3.2: Extragere live, normalizare și persistență agrodat.md.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Acoperire:
1. Normalizarea parametrilor meteo (°C aer, °C sol 10cm, W/m², %, Leaf Wetness, precipitații, ETo)
2. Detecția stațiilor inactive (offline > 24h sau senzori offline -> is_active = 0)
3. Parsarea datelor HTML/JSON de telemetrie cu BeautifulSoup
4. Comutarea corectă pe fallback-ul local garantat (moldova_stations.json) în caz de eroare / 403 / timeout
5. Generarea corectă a obiectului Pydantic ClimateTelemetry
6. Persistența graceful în PostgreSQL / PostGIS (sync_telemetry_to_database)
"""

import pytest
from unittest.mock import patch, MagicMock
from app.models.schemas import ClimateTelemetry
from app.models.db_models import WeatherStation, WeatherTelemetryRecord
from app.data_pipeline.agrodat_extractor import (
    normalize_station_telemetry,
    evaluate_station_activity,
    parse_agrodat_html_telemetry,
    fetch_live_agrodat_data,
    load_fallback_stations,
    get_available_stations,
    fetch_telemetry_for_station,
    sync_telemetry_to_database,
    sync_telemetry_to_database_sync,
)
from app.data_pipeline.worker import run_sync_cycle


# ============================================================================
# 1. TESTE PENTRU NORMALIZAREA PARAMETRILOR METEO
# ============================================================================

class TestAgrodatNormalization:
    """Verifică normalizarea completă a parametrilor agrometeorologici."""

    def test_normalize_station_telemetry_complete_values(self):
        """Verifică maparea corectă a tuturor parametrilor fizici."""
        raw = {
            "id": "agro-st-test-01",
            "name": "Stație Test",
            "region": "Chișinău",
            "latitude": 47.0105,
            "longitude": 28.8350,
            "elevation_m": 85,
            "air_temp_c": 22.4,
            "soil_temp_10cm_c": 19.1,
            "solar_radiation_w_m2": 580.0,
            "soil_moisture_pct": 43.5,
            "leaf_wetness_hours": 3.0,
            "precipitation_last_30d_mm": 27.5,
            "eto_evapotranspiration_mm": 4.6,
            "last_seen_hours_ago": 1.0
        }
        res = normalize_station_telemetry(raw)
        assert res["id"] == "agro-st-test-01"
        assert res["air_temp_c"] == 22.4
        assert res["soil_temp_10cm_c"] == 19.1
        assert res["solar_radiation_w_m2"] == 580.0
        assert res["soil_moisture_pct"] == 43.5
        assert res["leaf_wetness_hours"] == 3.0
        assert res["leaf_wetness_minutes"] == 180
        assert res["precipitation_last_30d_mm"] == 27.5
        assert res["eto_evapotranspiration_mm"] == 4.6
        assert res["is_active"] == 1

    def test_normalize_station_telemetry_handles_strings_and_bounds(self):
        """Verifică clamping-ul și conversia șirurilor textuale numerice."""
        raw = {
            "id": "agro-st-clamping",
            "air_temp_c": "100.5",  # peste limita de 55°C
            "soil_moisture_pct": "-10.0",  # sub 0%
            "leaf_wetness_hours": "30.0",  # peste 24h
            "solar_radiation_w_m2": "2000.0",  # peste 1500 W/m²
        }
        res = normalize_station_telemetry(raw)
        assert res["air_temp_c"] == 55.0
        assert res["soil_moisture_pct"] == 0.0
        assert res["leaf_wetness_hours"] == 24.0
        assert res["solar_radiation_w_m2"] == 1500.0

    def test_normalize_station_telemetry_missing_values_use_defaults(self):
        """Câmpurile lipsă sau goale primesc valori default sigure."""
        raw = {"id": "agro-st-empty"}
        res = normalize_station_telemetry(raw)
        assert res["air_temp_c"] == 20.0
        assert res["soil_temp_10cm_c"] == 17.5
        assert res["soil_moisture_pct"] == 40.0
        assert res["leaf_wetness_hours"] == 2.0
        assert res["eto_evapotranspiration_mm"] == 4.0


# ============================================================================
# 2. TESTE PENTRU DETECȚIA STAȚIILOR INACTIVE (is_active = 0)
# ============================================================================

class TestStationActivityDetection:
    """Verifică logica de marcare a stațiilor active vs inactive."""

    def test_station_active_with_recent_data(self):
        """Stație cu raportare recentă (ex: 1.5 ore în urmă) este activă (is_active = 1)."""
        station = {
            "last_seen_hours_ago": 1.5,
            "air_temp_c": 20.0,
            "soil_moisture_pct": 40.0
        }
        assert evaluate_station_activity(station) == 1

    def test_station_inactive_if_offline_over_24h(self):
        """Dacă nu a raportat date de mai mult de 24 de ore, is_active devine 0."""
        station = {
            "last_seen_hours_ago": 26.5,
            "air_temp_c": 20.0,
            "soil_moisture_pct": 40.0
        }
        assert evaluate_station_activity(station) == 0

    def test_station_inactive_if_sensors_offline_flag(self):
        """Dacă senzorii sunt marcați explicit offline, is_active devine 0."""
        station = {
            "last_seen_hours_ago": 0.5,
            "sensors_offline": True
        }
        assert evaluate_station_activity(station) == 0

    def test_station_inactive_if_status_offline(self):
        """Dacă statusul raportat este 'offline', is_active devine 0."""
        station = {
            "status": "offline",
            "last_seen_hours_ago": 1.0
        }
        assert evaluate_station_activity(station) == 0

    def test_station_inactive_if_critical_sensors_missing(self):
        """Dacă senzorii principali lipsesc complet, is_active devine 0."""
        station = {
            "last_seen_hours_ago": 1.0,
            "air_temp_c": None,
            "soil_moisture_pct": None
        }
        assert evaluate_station_activity(station) == 0


# ============================================================================
# 3. TESTE PENTRU SCRAPING LIVE ȘI BEAUTIFULSOUP
# ============================================================================

class TestAgrodatScraping:
    """Verifică parsarea datelor HTML și interogarea live."""

    def test_parse_agrodat_html_with_embedded_json(self):
        """Extrage corect stațiile dintr-un script tag cu JSON încorporat."""
        html = """
        <!doctype html>
        <html>
          <head><title>Agrodat</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {"stations": [
                {"id": "agro-live-01", "name": "Statie Live Nord", "region": "Balti", "air_temp_c": 19.5, "soil_moisture_pct": 45.0}
              ]}
            </script>
          </body>
        </html>
        """
        stations = parse_agrodat_html_telemetry(html)
        assert len(stations) == 1
        assert stations[0]["id"] == "agro-live-01"
        assert stations[0]["air_temp_c"] == 19.5
        assert stations[0]["soil_moisture_pct"] == 45.0

    def test_parse_agrodat_html_table_fallback(self):
        """Extrage stațiile din structură tabelară BeautifulSoup dacă este disponibilă."""
        html = """
        <table>
          <tr><th>Stație</th><th>Temperatură</th><th>Umiditate</th><th>Precipitații</th><th>ETo</th></tr>
          <tr><td>Stație Bălți Live</td><td>18.5 °C</td><td>48.0 %</td><td>30 mm</td><td>3.8</td></tr>
        </table>
        """
        stations = parse_agrodat_html_telemetry(html)
        assert len(stations) >= 1
        assert "Bălți" in stations[0]["name"]
        assert stations[0]["air_temp_c"] == 18.5
        assert stations[0]["soil_moisture_pct"] == 48.0


# ============================================================================
# 4. TESTE PENTRU COMUTAREA PE FALLBACK-UL LOCAL GARANTAT
# ============================================================================

class TestAgrodatFallback:
    """Verifică comutarea robustă pe moldova_stations.json."""

    def test_fallback_when_live_fails_with_network_error(self):
        """În caz de timeout sau eroare HTTP, se folosește fișierul moldova_stations.json."""
        with patch("httpx.Client.get", side_effect=Exception("Connection refused / Cloudflare 403")):
            stations = get_available_stations(force_fallback=False)
            assert len(stations) == 6
            station_ids = [s["id"] for s in stations]
            assert "agro-st-chisinau-01" in station_ids
            assert "agro-st-balti-01" in station_ids
            assert "agro-st-cahul-01" in station_ids

    def test_load_fallback_stations_has_all_required_parameters(self):
        """Toate stațiile din seed au parametrii pedo-climatici ceruți."""
        stations = load_fallback_stations()
        assert len(stations) >= 6
        for st in stations:
            assert "air_temp_c" in st
            assert "soil_temp_10cm_c" in st
            assert "solar_radiation_w_m2" in st
            assert "soil_moisture_pct" in st
            assert "leaf_wetness_hours" in st
            assert "precipitation_last_30d_mm" in st
            assert "eto_evapotranspiration_mm" in st
            assert st["is_active"] == 1

    def test_force_fallback_skips_network_call(self):
        """Parametrul force_fallback=True citește direct seed-ul fără cereri externe."""
        with patch("app.data_pipeline.agrodat_extractor.fetch_live_agrodat_data") as mock_fetch:
            stations = get_available_stations(force_fallback=True)
            mock_fetch.assert_not_called()
            assert len(stations) == 6


# ============================================================================
# 5. TESTE PENTRU CONTRACTUL PYDANTIC CLIMATETELEMETRY
# ============================================================================

class TestClimateTelemetryContract:
    """Verifică generarea corectă a obiectului ClimateTelemetry."""

    def test_fetch_telemetry_for_existing_station(self):
        """Generează ClimateTelemetry conform contractului JSON pentru o stație validă."""
        telemetry = fetch_telemetry_for_station("agro-st-chisinau-01", distance_km=5.5)
        assert isinstance(telemetry, ClimateTelemetry)
        assert telemetry.nearest_station_id == "agro-st-chisinau-01"
        assert telemetry.distance_km == 5.5
        assert telemetry.soil_moisture_pct == 42.0
        assert telemetry.leaf_wetness_hours == 3.5
        assert telemetry.precipitation_last_30d_mm == 28.0
        assert telemetry.eto_evapotranspiration_mm == 4.5

    def test_fetch_telemetry_for_unknown_station_fallback(self):
        """Dacă stația solicitată nu există, folosește prima stație validă ca fallback."""
        telemetry = fetch_telemetry_for_station("agro-st-inexistenta", distance_km=12.0)
        assert isinstance(telemetry, ClimateTelemetry)
        assert telemetry.nearest_station_id is not None
        assert telemetry.distance_km == 12.0
        assert telemetry.soil_moisture_pct > 0.0


# ============================================================================
# 6. TESTE PENTRU PERSISTENȚA ÎN BAZA DE DATE ȘI WORKER
# ============================================================================

class TestDatabasePersistenceAndWorker:
    """Verifică persistența în PostgreSQL/PostGIS și execuția worker-ului."""

    def test_sync_telemetry_handles_db_offline_gracefully(self):
        """Dacă PostgreSQL este offline, sync_telemetry nu crăpă și returnează 0."""
        import asyncio
        # Port invalid / server oprit
        count = asyncio.run(
            sync_telemetry_to_database(
                db_url="postgresql+asyncpg://user:pass@localhost:54329/invalid_db"
            )
        )
        assert count == 0

    def test_sync_telemetry_sync_wrapper(self):
        """Wrapper-ul sincron funcționează fără excepții când DB e oprit."""
        count = sync_telemetry_to_database_sync(
            db_url="postgresql+asyncpg://user:pass@localhost:54329/invalid_db"
        )
        assert count == 0

    def test_worker_run_sync_cycle(self):
        """Ciclul complet de sincronizare din worker.py rulează fără erori."""
        result = run_sync_cycle()
        # Chiar dacă DB e oprit local, returnează un cod întreg fără excepție
        assert isinstance(result, int)
