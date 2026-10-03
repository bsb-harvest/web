"""
Teste unitare și de integrare pentru Task 3.3: Scheduler automat periodic (APScheduler),
detecția stațiilor offline și algoritmul de interpolare spațială (IDW).
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Acoperire:
1. Pornirea și oprirea AsyncIOScheduler și execuția ciclului periodic de sincronizare
2. Detecția și izolarea stațiilor offline (>24h vechime, valori nule None/NaN)
3. Corectitudinea matematică a formulei IDW (w_i = 1 / d_i^2)
4. Comportamentul find_nearest_station_and_telemetry când stația apropiată e offline/defasată
"""

import math
import asyncio
import pytest
from unittest.mock import patch, MagicMock

from app.core.config import settings
from app.models.schemas import ClimateTelemetry
from app.data_pipeline.worker import (
    start_telemetry_scheduler,
    stop_telemetry_scheduler,
    scheduled_telemetry_sync_cycle,
    validate_station_sensors,
    run_sync_cycle,
    get_async_scheduler,
)
from app.data_pipeline.spatial_matcher import (
    haversine_distance_km,
    interpolate_telemetry_idw,
    find_nearest_station_and_telemetry,
)


# ============================================================================
# 1. TESTE PENTRU APSCHEDULER PERIODIC ȘI CICLUL DE SINCRONIZARE
# ============================================================================

class TestTelemetryScheduler:
    """Verifică pornirea, oprirea și ciclul de execuție al scheduler-ului."""

    def test_scheduler_startup_and_shutdown(self):
        """Scheduler-ul pornește, configurează jobul de sincronizare și se oprește curat."""
        scheduler = start_telemetry_scheduler(interval_hours=2)
        assert scheduler.running is True

        # Verifică prezența jobului
        job = scheduler.get_job("agrodat_telemetry_sync")
        assert job is not None
        assert "agrodat" in job.id

        # Oprire scheduler
        stop_telemetry_scheduler(scheduler)
        assert scheduler.running is False

    def test_asyncio_scheduler_within_event_loop(self):
        """AsyncIOScheduler pornește cu succes într-un event loop asincron (ex: lifespan)."""
        async def _test():
            scheduler = start_telemetry_scheduler(interval_hours=1)
            assert scheduler.running is True
            assert scheduler.get_job("agrodat_telemetry_sync") is not None
            stop_telemetry_scheduler(scheduler)
            await asyncio.sleep(0.05)
            assert scheduler.running is False

        asyncio.run(_test())

    def test_scheduled_sync_cycle_runs_without_exceptions(self):
        """Un ciclu complet de sincronizare periodică rulează fără a arunca erori."""
        persisted_count = run_sync_cycle()
        # Chiar dacă DB este offline local, rezultatul este un întreg non-negativ
        assert isinstance(persisted_count, int)
        assert persisted_count >= 0

    def test_async_scheduled_sync_cycle_execution(self):
        """Funcția asincronă scheduled_telemetry_sync_cycle() se execută cu succes."""
        count = asyncio.run(scheduled_telemetry_sync_cycle())
        assert isinstance(count, int)
        assert count >= 0


# ============================================================================
# 2. TESTE PENTRU DETECȚIA ȘI IZOLAREA STAȚIILOR OFFLINE
# ============================================================================

class TestOfflineStationDetectionAndIsolation:
    """Verifică validarea stării senzorilor și marcarea stațiilor offline."""

    def test_station_detected_offline_when_stale_over_24h(self):
        """O stație cu raportare mai veche de 24 de ore este marcată offline (is_active = 0)."""
        st = {
            "id": "agro-st-stale",
            "name": "Stație Învechită",
            "last_seen_hours_ago": 28.5,
            "air_temp_c": 21.0,
            "soil_moisture_pct": 42.0
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 0

    def test_station_detected_offline_when_air_temperature_is_none(self):
        """O stație cu senzor de temperatură defect (None) este marcată offline."""
        st = {
            "id": "agro-st-temp-broken",
            "last_seen_hours_ago": 1.0,
            "air_temp_c": None,
            "soil_moisture_pct": 42.0
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 0

    def test_station_detected_offline_when_temperature_is_nan(self):
        """O stație cu temperatură NaN este marcată offline."""
        st = {
            "id": "agro-st-temp-nan",
            "last_seen_hours_ago": 1.0,
            "air_temp_c": float("nan"),
            "soil_moisture_pct": 42.0
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 0

    def test_station_detected_offline_when_soil_moisture_is_none(self):
        """O stație cu senzor de umiditate a solului defect (None) este marcată offline."""
        st = {
            "id": "agro-st-moisture-broken",
            "last_seen_hours_ago": 1.0,
            "air_temp_c": 22.0,
            "soil_moisture_pct": None
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 0

    def test_station_detected_offline_when_moisture_is_nan(self):
        """O stație cu umiditate a solului NaN este marcată offline."""
        st = {
            "id": "agro-st-moisture-nan",
            "last_seen_hours_ago": 1.0,
            "air_temp_c": 22.0,
            "soil_moisture_pct": float("nan")
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 0

    def test_station_remains_active_when_all_sensors_valid_and_fresh(self):
        """O stație recentă cu senzori funcționali este marcată ca activă (is_active = 1)."""
        st = {
            "id": "agro-st-healthy",
            "last_seen_hours_ago": 0.8,
            "air_temp_c": 21.5,
            "soil_moisture_pct": 44.0,
            "leaf_wetness_hours": 3.0
        }
        validated = validate_station_sensors(st)
        assert validated["is_active"] == 1

    def test_sync_cycle_isolates_corrupted_station(self):
        """O eroare la o stație coruptă nu blochează restul ciclului de sincronizare."""
        mock_stations = [
            {"id": "st-valid-01", "name": "Valida", "last_seen_hours_ago": 1.0, "air_temp_c": 20.0, "soil_moisture_pct": 40.0},
            {"id": "st-corrupt", "name": "Corupta", "last_seen_hours_ago": "INVALID_NUMBER", "air_temp_c": None},
            {"id": "st-valid-02", "name": "Valida 2", "last_seen_hours_ago": 2.0, "air_temp_c": 19.0, "soil_moisture_pct": 45.0}
        ]
        with patch("app.data_pipeline.worker.get_available_stations", return_value=mock_stations):
            result = run_sync_cycle()
            assert isinstance(result, int)


# ============================================================================
# 3. TESTE PENTRU CORECTITUDINEA MATEMATICĂ IDW (w_i = 1 / d_i^2)
# ============================================================================

class TestIDWMathematics:
    """Verifică formula matematică a interpolării spațiale IDW."""

    def test_idw_exact_formula_calculation(self):
        """
        Verificare matematică riguroasă a formulei IDW cu 2 stații:
        Target: distanța d1 = 10 km, val1 = 40.0; distanța d2 = 20 km, val2 = 50.0.
        Ponderi: w1 = 1 / (10^2) = 0.01; w2 = 1 / (20^2) = 0.0025.
        Suma ponderilor W = 0.0125.
        Valoare interpolată: (0.01 * 40 + 0.0025 * 50) / 0.0125 = (0.4 + 0.125) / 0.0125 = 42.0.
        """
        # Creăm coordonate astfel încât distanțele de la (47.0, 28.0) să fie cunoscute
        target_lat = 47.0
        target_lng = 28.0

        # Stația 1 la ~10 km nord
        # 1 grad lat ~ 111 km -> 10 km ~ 0.0901 grade lat
        st1_lat = target_lat + (10.0 / 111.0)
        st1_lng = target_lng

        # Stația 2 la ~20 km nord
        st2_lat = target_lat + (20.0 / 111.0)
        st2_lng = target_lng

        d1 = haversine_distance_km(target_lat, target_lng, st1_lat, st1_lng)
        d2 = haversine_distance_km(target_lat, target_lng, st2_lat, st2_lng)

        active_stations = [
            {
                "id": "st-1",
                "latitude": st1_lat,
                "longitude": st1_lng,
                "soil_moisture_pct": 40.0,
                "leaf_wetness_hours": 2.0,
                "precipitation_last_30d_mm": 20.0,
                "eto_evapotranspiration_mm": 4.0
            },
            {
                "id": "st-2",
                "latitude": st2_lat,
                "longitude": st2_lng,
                "soil_moisture_pct": 50.0,
                "leaf_wetness_hours": 4.0,
                "precipitation_last_30d_mm": 30.0,
                "eto_evapotranspiration_mm": 5.0
            }
        ]

        interpolated, used_ids = interpolate_telemetry_idw(
            target_lat, target_lng, active_stations, k=2, power=2.0
        )

        assert "soil_moisture_pct" in interpolated
        # Calcul manual cu distanțele reale haversine:
        w1 = 1.0 / (d1 ** 2)
        w2 = 1.0 / (d2 ** 2)
        expected_moisture = round((w1 * 40.0 + w2 * 50.0) / (w1 + w2), 2)

        assert math.isclose(interpolated["soil_moisture_pct"], expected_moisture, rel_tol=1e-2)
        assert len(used_ids) == 2
        assert "st-1" in used_ids and "st-2" in used_ids

    def test_idw_prefers_closer_station(self):
        """Stația mai apropiată trebuie să aibă o influență mult mai mare în IDW."""
        target_lat = 47.0105
        target_lng = 28.8350

        # Stație foarte apropiată (1 km, valoare 42.0) vs stație la 50 km (valoare 80.0)
        close_st = {
            "id": "close",
            "latitude": target_lat + 0.009,  # ~1 km
            "longitude": target_lng,
            "soil_moisture_pct": 42.0
        }
        far_st = {
            "id": "far",
            "latitude": target_lat + 0.45,   # ~50 km
            "longitude": target_lng,
            "soil_moisture_pct": 80.0
        }

        interpolated, _ = interpolate_telemetry_idw(
            target_lat, target_lng, [close_st, far_st], k=2, power=2.0
        )
        # Valoarea trebuie să fie extrem de apropiată de 42.0
        assert 42.0 <= interpolated["soil_moisture_pct"] <= 43.0


# ============================================================================
# 4. TESTE PENTRU FIND_NEAREST_STATION_AND_TELEMETRY CU IDW
# ============================================================================

class TestNearestStationWithIDW:
    """Verifică comutarea automată între citire directă și IDW."""

    def test_nearest_station_uses_direct_telemetry_when_healthy(self):
        """Când cea mai apropiată stație este activă și are date complete, is_interpolated este False."""
        mock_stations = [
            {
                "id": "st-chisinau-active",
                "name": "Chișinău Activ",
                "latitude": 47.0105,
                "longitude": 28.8350,
                "is_active": 1,
                "soil_moisture_pct": 42.5,
                "leaf_wetness_hours": 3.2,
                "precipitation_last_30d_mm": 28.0,
                "eto_evapotranspiration_mm": 4.5
            },
            {
                "id": "st-orhei-active",
                "name": "Orhei Activ",
                "latitude": 47.3831,
                "longitude": 28.8231,
                "is_active": 1,
                "soil_moisture_pct": 45.0,
                "leaf_wetness_hours": 4.0,
                "precipitation_last_30d_mm": 30.0,
                "eto_evapotranspiration_mm": 4.2
            }
        ]

        # Punct chiar în Chișinău
        res = find_nearest_station_and_telemetry(47.0105, 28.8350, stations=mock_stations)
        assert isinstance(res, ClimateTelemetry)
        assert res.nearest_station_id == "st-chisinau-active"
        assert res.soil_moisture_pct == 42.5
        assert res.is_interpolated is False

    def test_nearest_station_applies_idw_when_closest_station_is_offline(self):
        """Când cea mai apropiată stație este offline (is_active=0), se activează interpolarea IDW."""
        mock_stations = [
            {
                "id": "st-chisinau-offline",
                "name": "Chișinău Offline",
                "latitude": 47.0105,
                "longitude": 28.8350,
                "is_active": 0,  # OFFLINE!
                "soil_moisture_pct": 99.0
            },
            {
                "id": "st-orhei-active",
                "name": "Orhei Activ",
                "latitude": 47.3831,
                "longitude": 28.8231,
                "is_active": 1,
                "soil_moisture_pct": 44.0,
                "leaf_wetness_hours": 3.8,
                "precipitation_last_30d_mm": 31.0,
                "eto_evapotranspiration_mm": 4.1
            },
            {
                "id": "st-balti-active",
                "name": "Bălți Activ",
                "latitude": 47.7617,
                "longitude": 27.9289,
                "is_active": 1,
                "soil_moisture_pct": 46.0,
                "leaf_wetness_hours": 4.2,
                "precipitation_last_30d_mm": 34.0,
                "eto_evapotranspiration_mm": 3.9
            }
        ]

        res = find_nearest_station_and_telemetry(47.0105, 28.8350, stations=mock_stations, k_idw=2)
        assert isinstance(res, ClimateTelemetry)
        assert res.nearest_station_id == "st-chisinau-offline"
        assert res.is_interpolated is True
        # Valoarea interpolată este între Orhei (44%) și Bălți (46%), mai aproape de Orhei
        assert 44.0 <= res.soil_moisture_pct <= 46.0

    def test_nearest_station_applies_idw_when_closest_station_has_null_sensors(self):
        """Când cea mai apropiată stație are umiditatea solului Null/None, se activează IDW."""
        mock_stations = [
            {
                "id": "st-chisinau-defective",
                "name": "Chișinău Senzor Defect",
                "latitude": 47.0105,
                "longitude": 28.8350,
                "is_active": 1,
                "soil_moisture_pct": None,  # Senzor defect!
                "leaf_wetness_hours": 3.0,
                "precipitation_last_30d_mm": 25.0,
                "eto_evapotranspiration_mm": 4.0
            },
            {
                "id": "st-orhei-active",
                "name": "Orhei Activ",
                "latitude": 47.3831,
                "longitude": 28.8231,
                "is_active": 1,
                "soil_moisture_pct": 44.0,
                "leaf_wetness_hours": 3.5,
                "precipitation_last_30d_mm": 30.0,
                "eto_evapotranspiration_mm": 4.2
            },
            {
                "id": "st-cahul-active",
                "name": "Cahul Activ",
                "latitude": 45.9075,
                "longitude": 28.1944,
                "is_active": 1,
                "soil_moisture_pct": 32.0,
                "leaf_wetness_hours": 2.0,
                "precipitation_last_30d_mm": 18.0,
                "eto_evapotranspiration_mm": 5.0
            }
        ]

        res = find_nearest_station_and_telemetry(47.0105, 28.8350, stations=mock_stations, k_idw=2)
        assert isinstance(res, ClimateTelemetry)
        assert res.is_interpolated is True
        # Umiditatea a fost interpolată din Orhei și Cahul
        assert 32.0 < res.soil_moisture_pct < 44.0
