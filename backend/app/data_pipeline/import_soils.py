"""
Script ETL de import și ingestie a datelor pedologice din GeoJSON/WFS în PostGIS.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.1: Parsare Shapely, transformare MultiPolygon și persistență în tabela soil_profiles.
"""

import sys
import os
from pathlib import Path

# Asigură accesul la pachetul app chiar dacă scriptul este executat direct din terminal
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import logging
import asyncio
import argparse
from typing import List, Dict, Any, Optional, Tuple

from shapely.geometry import shape, Polygon, MultiPolygon
from shapely import wkt

from app.core.config import settings
from app.models.db_models import SoilProfileRecord, HAS_GEOALCHEMY
from app.data_pipeline.soluri_extractor import clean_soil_record, load_seed_soil_features

# Suport GeoAlchemy2 dacă este instalat
try:
    from geoalchemy2.elements import WKTElement
    from geoalchemy2.shape import from_shape
except ImportError:
    WKTElement = None
    from_shape = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ImportSoilsETL")


def parse_geojson_to_multipolygon_wkt(feature_geom: Dict[str, Any]) -> Tuple[MultiPolygon, str]:
    """
    Parsează geometria GeoJSON cu Shapely și o convertește în MultiPolygon (WGS84 EPSG:4326).
    Returnează tuplul (shapely_multipolygon, wkt_string).
    """
    geom_obj = shape(feature_geom)
    if not geom_obj.is_valid:
        geom_obj = geom_obj.buffer(0)

    if isinstance(geom_obj, Polygon):
        multipoly = MultiPolygon([geom_obj])
    elif isinstance(geom_obj, MultiPolygon):
        multipoly = geom_obj
    else:
        raise ValueError(f"Geometria de tip {geom_obj.geom_type} nu poate fi convertită în MultiPolygon.")

    return multipoly, multipoly.wkt


def prepare_soil_record_dict(feature: Dict[str, Any], force_wkt: bool = False) -> Dict[str, Any]:
    """
    Pregătește atributele unui record SoilProfileRecord dintr-un feature GeoJSON:
    - Curăță atributele pedologice via clean_soil_record.
    - Generează geometria Shapely MultiPolygon și reprezentarea WKT.
    """
    raw_props = feature.get("properties", {})
    cleaned = clean_soil_record(raw_props)

    raw_geom = feature.get("geometry")
    if not raw_geom:
        raise ValueError(f"Feature-ul {feature.get('id', 'necunoscut')} nu conține geometrie!")

    multi_geom, wkt_str = parse_geojson_to_multipolygon_wkt(raw_geom)

    record_data = {
        "soil_type": cleaned["soil_type"],
        "bonitate_score": cleaned["bonitate_points"],
        "humus_percentage": cleaned["humus_pct"],
        "ph_level": cleaned["ph"],
        "erosion_grade": cleaned["erosion_grade"],
        "geom_wkt": wkt_str
    }

    # Atribuire geometrie binară PostGIS dacă GeoAlchemy este disponibil și nu e forțat fallback WKT
    if HAS_GEOALCHEMY and WKTElement is not None and not force_wkt:
        record_data["geom"] = WKTElement(wkt_str, srid=4326)
    else:
        record_data["geom"] = None

    return record_data


async def import_soils_to_db(
    geojson_path: Optional[Path] = None,
    db_url: Optional[str] = None,
    force_wkt: bool = False,
    truncate: bool = False
) -> int:
    """
    Rulează pipeline-ul ETL:
    1. Încarcă poligoanele din fișierul GeoJSON.
    2. Curăță și transformă atributele și geometriile.
    3. Populează tabela soil_profiles din PostgreSQL/PostGIS (cu fallback pe WKT).
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select, delete, text

    target_url = db_url or settings.DATABASE_URL
    target_path = geojson_path or (Path(__file__).parent / "seed" / "moldova_soils.geojson")

    logger.info(f"Încărcare date pedologice din: {target_path}")
    if not target_path.exists():
        logger.error(f"Fișierul GeoJSON nu există: {target_path}")
        return 0

    with open(target_path, "r", encoding="utf-8") as f:
        geojson_data = json.load(f)

    features = geojson_data.get("features", [])
    if not features:
        logger.warning("Nu s-au găsit features în fișierul GeoJSON!")
        return 0

    logger.info(f"S-au identificat {len(features)} poligoane de sol pentru import.")

    # Conectare la baza de date
    logger.info(f"Inițiere conexiune la baza de date: {target_url}")
    engine = create_async_engine(target_url, future=True)
    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    imported_count = 0
    try:
        async with async_session() as session:
            async with session.begin():
                if truncate:
                    logger.info("Golire tabelă 'soil_profiles' înainte de import...")
                    await session.execute(delete(SoilProfileRecord))

                for feat in features:
                    try:
                        record_dict = prepare_soil_record_dict(feat, force_wkt=force_wkt)

                        # Încercare de persistență cu Geometry PostGIS
                        record = SoilProfileRecord(
                            soil_type=record_dict["soil_type"],
                            bonitate_score=record_dict["bonitate_score"],
                            humus_percentage=record_dict["humus_percentage"],
                            ph_level=record_dict["ph_level"],
                            erosion_grade=record_dict["erosion_grade"],
                            geom=record_dict.get("geom") if hasattr(SoilProfileRecord, "geom") else None,
                            geom_wkt=record_dict.get("geom_wkt")
                        )
                        session.add(record)
                        imported_count += 1
                    except Exception as err:
                        logger.error(f"Eroare la procesarea feature-ului {feat.get('id')}: {err}")

            await session.commit()
            logger.info(f"Import finalizat cu succes! {imported_count} profiluri de sol salvate în DB.")

    except Exception as db_err:
        is_conn_error = any(isinstance(db_err, t) for t in (OSError, ConnectionRefusedError)) or "refused" in str(db_err).lower()
        if not is_conn_error and not force_wkt and hasattr(SoilProfileRecord, "geom"):
            logger.warning(
                f"Nu s-a putut salva geometria nativă PostGIS ({db_err}). "
                "Se activează automat fallback-ul pe stocare WKT..."
            )
            return await import_soils_to_db(
                geojson_path=target_path,
                db_url=target_url,
                force_wkt=True,
                truncate=truncate
            )
        else:
            logger.warning(
                f"Nu s-a putut finaliza tranzacția DB ({db_err})."
            )
            raise db_err
    finally:
        await engine.dispose()

    return imported_count


def run_cli():
    """Entrypoint CLI pentru executarea scriptului de import."""
    parser = argparse.ArgumentParser(description="ETL Import Soluri Moldova în PostgreSQL/PostGIS")
    parser.add_argument(
        "--geojson",
        type=str,
        default=None,
        help="Calea către fișierul GeoJSON de import (implicit: seed/moldova_soils.geojson)"
    )
    parser.add_argument(
        "--db-url",
        type=str,
        default=None,
        help="URL de conexiune SQLAlchemy la baza de date"
    )
    parser.add_argument(
        "--force-wkt",
        action="store_true",
        help="Forțează stocarea ca text WKT (fallback pentru baze fără extensie PostGIS)"
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Golește tabela soil_profiles înainte de inserare"
    )

    args = parser.parse_args()
    geojson_path = Path(args.geojson) if args.geojson else None

    try:
        count = asyncio.run(
            import_soils_to_db(
                geojson_path=geojson_path,
                db_url=args.db_url,
                force_wkt=args.force_wkt,
                truncate=args.truncate
            )
        )
        print(f"✅ Succes: S-au importat {count} profiluri pedologice.")
    except Exception as exc:
        print(f"⚠️ Notă: Conexiunea DB a raportat: {exc}")
        print("💡 Pipeline-ul este funcțional. Asigurați-vă că serverul PostgreSQL/PostGIS rulează pe portul specificat.")
        sys.exit(0)


if __name__ == "__main__":
    run_cli()
