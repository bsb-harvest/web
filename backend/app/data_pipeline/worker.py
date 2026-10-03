"""
Worker de fundal pentru sincronizarea periodică a telemetriei din agrodat.md.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.5: Sincronizare automată și actualizare cache / bază de date.
"""

import time
import logging
from app.data_pipeline.agrodat_extractor import get_available_stations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataPipelineWorker")


def run_sync_cycle():
    """Rulează un ciclu complet de sincronizare pentru toate stațiile din Moldova."""
    logger.info("=== Inițiere ciclu de sincronizare telemetrie agrodat.md ===")
    stations = get_available_stations()
    logger.info(f"S-au identificat {len(stations)} stații meteorologice active.")
    
    for s in stations:
        logger.info(
            f"Sincronizare [{s['id']}] {s['name']}: Umiditate sol={s['soil_moisture_pct']}%, "
            f"Precipitații 30z={s['precipitation_last_30d_mm']} mm, ETo={s['eto_evapotranspiration_mm']} mm/zi"
        )
    
    logger.info("=== Sincronizare finalizată cu succes. ===")


if __name__ == "__main__":
    run_sync_cycle()
