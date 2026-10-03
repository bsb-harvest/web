"""
Worker de fundal și scheduler periodic pentru sincronizarea telemetriei din agrodat.md.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.3: APScheduler asincron, job periodic (1h), validare senzori/stații offline și persistență DB.
"""

import sys
import math
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

# Asigură accesul la pachetul app dacă scriptul este executat direct din terminal
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.data_pipeline.agrodat_extractor import (
    get_available_stations,
    sync_telemetry_to_database,
    evaluate_station_activity,
    normalize_station_telemetry,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DataPipelineWorker")

_async_scheduler: Optional[AsyncIOScheduler] = None
_background_scheduler: Optional[BackgroundScheduler] = None


def validate_station_sensors(station: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validează integritatea senzorilor pentru o stație:
    - Dacă nu răspunde, are timestamp mai vechi de 24h sau returnează valori nule
      (None / NaN) pentru umiditatea solului și temperatură, o marchează ca offline (is_active = 0).
    - Returnează un dicționar cu starea actualizată.
    """
    st_copy = dict(station)

    # 1. Verificare timestamp / vechime
    last_seen = st_copy.get("last_seen_hours_ago")
    if last_seen is None:
        last_seen = st_copy.get("hours_since_report")

    is_stale = False
    if last_seen is not None:
        try:
            if float(last_seen) > 24.0:
                is_stale = True
        except (ValueError, TypeError):
            is_stale = True

    # 2. Verificare senzori nuli (None / NaN)
    temp = st_copy.get("air_temp_c")
    moisture = st_copy.get("soil_moisture_pct")

    temp_is_null = temp is None or (isinstance(temp, float) and math.isnan(temp))
    moisture_is_null = moisture is None or (isinstance(moisture, float) and math.isnan(moisture))

    has_sensor_failure = temp_is_null or moisture_is_null

    # 3. Marcare offline
    if is_stale or has_sensor_failure or st_copy.get("sensors_offline") is True:
        st_copy["is_active"] = 0
        status_reason = []
        if is_stale:
            status_reason.append(f">24h vechime ({last_seen}h)")
        if temp_is_null:
            status_reason.append("temp_aer=Null")
        if moisture_is_null:
            status_reason.append("umiditate_sol=Null")
        logger.warning(
            f"Stația [{st_copy.get('id')}] marcată OFFLINE (is_active=0). Motive: {', '.join(status_reason)}"
        )
    else:
        st_copy["is_active"] = evaluate_station_activity(st_copy)

    return st_copy


async def scheduled_telemetry_sync_cycle() -> int:
    """
    Execută un ciclu complet de sincronizare periodică a telemetriei:
    1. Preia datele de la conectorul agrodat.md.
    2. Validează integritatea senzorilor și detectează stațiile offline.
    3. Persistă măsurătorile în tabelele weather_stations și agro_weather_telemetry din PostgreSQL.
    4. Tratează erorile la nivel de stație pentru a nu bloca întregul ciclu.
    """
    logger.info("=== [APScheduler Job] Inițiere ciclu sincronizare telemetrie agrodat.md ===")
    try:
        stations = get_available_stations()
        logger.info(f"S-au identificat {len(stations)} stații meteorologice în catalog.")

        validated_stations = []
        for st in stations:
            try:
                validated_st = validate_station_sensors(st)
                validated_stations.append(validated_st)
            except Exception as st_err:
                logger.error(f"Eroare la validarea stației {st.get('id')}: {st_err}. Izolare eroare.")
                fallback_st = dict(st)
                fallback_st["is_active"] = 0
                validated_stations.append(fallback_st)

        # Persistență în baza de date cu tratare graceful dacă DB e indisponibil
        persisted = await sync_telemetry_to_database(validated_stations)
        active_count = sum(1 for s in validated_stations if s.get("is_active") == 1)
        offline_count = len(validated_stations) - active_count

        logger.info(
            f"=== [APScheduler Job] Sincronizare finalizată. "
            f"Active: {active_count}, Offline: {offline_count}, Persistate în DB: {persisted} ==="
        )
        return persisted

    except Exception as cycle_err:
        logger.error(f"[APScheduler Job] Eroare neprevăzută în ciclul de sincronizare: {cycle_err}")
        return 0


def run_sync_cycle() -> int:
    """Entrypoint sincron pentru execuția unui ciclu de sincronizare (manual sau teste)."""
    return asyncio.run(scheduled_telemetry_sync_cycle())


def get_async_scheduler() -> AsyncIOScheduler:
    """Obține sau creează instanța singleton AsyncIOScheduler."""
    global _async_scheduler
    if _async_scheduler is None:
        _async_scheduler = AsyncIOScheduler()
    return _async_scheduler


def get_background_scheduler() -> BackgroundScheduler:
    """Obține sau creează instanța singleton BackgroundScheduler."""
    global _background_scheduler
    if _background_scheduler is None:
        _background_scheduler = BackgroundScheduler()
    return _background_scheduler


def start_telemetry_scheduler(interval_hours: Optional[int] = None) -> Any:
    """
    Inițializează și pornește scheduler-ul cu job periodic de sincronizare:
    - Folosește AsyncIOScheduler dacă există un event loop activ (ex: în lifespan FastAPI).
    - Folosește BackgroundScheduler dacă rulează într-un context sincron.
    """
    hours = interval_hours or getattr(settings, "SYNC_INTERVAL_HOURS", 1)

    try:
        loop = asyncio.get_running_loop()
        scheduler = get_async_scheduler()
        if not scheduler.running:
            trigger = IntervalTrigger(hours=hours)
            scheduler.add_job(
                scheduled_telemetry_sync_cycle,
                trigger=trigger,
                id="agrodat_telemetry_sync",
                name="Sincronizare periodica telemetrie agrodat.md",
                replace_existing=True
            )
            scheduler.start()
            logger.info(f"✅ AsyncIOScheduler pornit cu succes. Interval: {hours}h.")
        return scheduler
    except RuntimeError:
        # Context sincron (fără running loop): folosim BackgroundScheduler
        scheduler = get_background_scheduler()
        if not scheduler.running:
            trigger = IntervalTrigger(hours=hours)
            scheduler.add_job(
                run_sync_cycle,
                trigger=trigger,
                id="agrodat_telemetry_sync",
                name="Sincronizare periodica telemetrie agrodat.md",
                replace_existing=True
            )
            scheduler.start()
            logger.info(f"✅ BackgroundScheduler pornit cu succes. Interval: {hours}h.")
        return scheduler


def stop_telemetry_scheduler(scheduler: Optional[Any] = None):
    """Oprește scheduler-ul activ."""
    targets = [scheduler] if scheduler else [_async_scheduler, _background_scheduler]
    for target in targets:
        if target and target.running:
            try:
                target.shutdown(wait=False)
                logger.info(f"🛑 {target.__class__.__name__} oprit cu succes.")
            except Exception:
                pass


async def main_worker_process():
    """Loop principal pentru modul de execuție standalone al worker-ului."""
    logger.info("Pornire proces Data Pipeline Worker autonom...")
    start_telemetry_scheduler()

    # Rulează primul ciclu de sincronizare imediat la pornire
    await scheduled_telemetry_sync_cycle()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        stop_telemetry_scheduler()
        logger.info("Worker oprit manual.")


if __name__ == "__main__":
    asyncio.run(main_worker_process())
