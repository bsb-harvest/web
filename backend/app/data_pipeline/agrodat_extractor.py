"""
Extractor, scraper și adaptor pentru platforma agrodat.md.
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.2: Extragere live (XHR/HTML Scraping), normalizare parametri, fallback local garantat
și persistență în PostgreSQL/PostGIS (tabelele weather_stations și agro_weather_telemetry).
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.models.schemas import ClimateTelemetry
from app.models.db_models import WeatherStation, WeatherTelemetryRecord

logger = logging.getLogger("AgrodatExtractor")


def evaluate_station_activity(station: Dict[str, Any]) -> int:
    """
    Evaluează starea operațională a stației agrometeorologice:
    - Dacă nu raportează date de mai mult de 24 de ore -> is_active = 0.
    - Dacă senzorii critici sunt offline sau marcați ca inactivi -> is_active = 0.
    - Altfel -> is_active = 1.
    """
    # 1. Verificare flag explicit sau status textual
    if station.get("is_active") == 0:
        return 0
    status = str(station.get("status", "")).lower().strip()
    if status in ["offline", "inactive", "disconectar", "defasata", "error"]:
        return 0

    # 2. Verificare vechime ultima raportare (> 24h)
    last_seen_hours = station.get("last_seen_hours_ago")
    if last_seen_hours is None:
        last_seen_hours = station.get("hours_since_report")
    if last_seen_hours is not None:
        try:
            if float(last_seen_hours) > 24.0:
                return 0
        except (ValueError, TypeError):
            pass

    # 3. Verificare senzori offline
    if station.get("sensors_offline") is True:
        return 0

    # Dacă toți senzorii principali lipsesc complet
    has_temp = station.get("air_temp_c") is not None
    has_moisture = station.get("soil_moisture_pct") is not None
    if not has_temp and not has_moisture:
        return 0

    return 1


def normalize_station_telemetry(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validează și normalizează parametrii agrometeorologici colectați:
    - Temperatura aerului (°C)
    - Temperatura solului la 10 cm (°C)
    - Radiația solară (W/m²)
    - Umiditatea solului (%) și orele de umiditate pe frunze
    - Precipitații pe 30 zile (mm) și evapotranspirația ETo (mm/zi).
    """
    def to_float(val: Any, default: float, min_val: float, max_val: float) -> float:
        if val is None or str(val).strip() == "":
            return default
        try:
            v = float(val)
            return max(min_val, min(max_val, v))
        except (ValueError, TypeError):
            return default

    # ID și nume
    st_id = str(raw.get("id") or f"agro-st-{raw.get('region', 'md').lower()[:6]}-01")
    name = str(raw.get("name") or f"Stația Agro-Meteo {raw.get('region', 'Moldova')}")
    region = str(raw.get("region") or "Centru")
    lat = to_float(raw.get("latitude") or raw.get("lat"), 47.0, 45.0, 49.0)
    lng = to_float(raw.get("longitude") or raw.get("lng") or raw.get("lon"), 28.5, 26.0, 31.0)
    elev = int(raw.get("elevation_m") or 100)

    # Parametrii fizici
    air_temp = round(to_float(raw.get("air_temp_c"), 20.0, -40.0, 55.0), 1)
    soil_temp_10cm = round(to_float(raw.get("soil_temp_10cm_c"), 17.5, -20.0, 50.0), 1)
    solar_rad = round(to_float(raw.get("solar_radiation_w_m2"), 500.0, 0.0, 1500.0), 1)
    soil_moisture = round(to_float(raw.get("soil_moisture_pct"), 40.0, 0.0, 100.0), 1)
    leaf_wetness = round(to_float(raw.get("leaf_wetness_hours"), 2.0, 0.0, 24.0), 1)
    precip_30d = round(to_float(raw.get("precipitation_last_30d_mm") or raw.get("precipitation_mm"), 25.0, 0.0, 500.0), 1)
    eto = round(to_float(raw.get("eto_evapotranspiration_mm"), 4.0, 0.0, 20.0), 2)

    is_act = evaluate_station_activity(raw)

    return {
        "id": st_id,
        "name": name,
        "region": region,
        "latitude": round(lat, 4),
        "longitude": round(lng, 4),
        "elevation_m": elev,
        "is_active": is_act,
        "last_seen_hours_ago": raw.get("last_seen_hours_ago", 0.5),
        "air_temp_c": air_temp,
        "soil_temp_10cm_c": soil_temp_10cm,
        "solar_radiation_w_m2": solar_rad,
        "soil_moisture_pct": soil_moisture,
        "leaf_wetness_hours": leaf_wetness,
        "leaf_wetness_minutes": int(round(leaf_wetness * 60)),
        "precipitation_last_30d_mm": precip_30d,
        "eto_evapotranspiration_mm": eto,
    }


def parse_agrodat_html_telemetry(html_content: str) -> List[Dict[str, Any]]:
    """
    Extrage datele meteo din HTML-ul paginii agrodat.md folosind BeautifulSoup.
    Analizează tabele, structuri de carduri agrometeo sau date JSON încorporate.
    """
    stations: List[Dict[str, Any]] = []
    soup = BeautifulSoup(html_content, "html.parser")

    # 1. Căutare script tags cu JSON încorporat (ex: __NEXT_DATA__ sau window.__INITIAL_STATE__)
    for script in soup.find_all("script"):
        text = script.string or ""
        if "stations" in text or "telemetry" in text:
            try:
                # Căutare sub-string JSON
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    data = json.loads(text[start:end + 1])
                    if "stations" in data and isinstance(data["stations"], list):
                        for st in data["stations"]:
                            stations.append(normalize_station_telemetry(st))
            except Exception:
                pass

    # 2. Căutare elemente tabelare dacă există tabele de stații
    rows = soup.find_all("tr")
    for row in rows:
        cols = row.find_all(["td", "th"])
        if len(cols) >= 5:
            col_texts = [c.get_text(strip=True) for c in cols]
            # Verifică dacă rândul pare a fi o stație (conține valori de temperatură/umiditate)
            if any("°c" in c.lower() or "%" in c for c in col_texts):
                try:
                    station_dict = {
                        "name": col_texts[0],
                        "air_temp_c": col_texts[1].replace("°C", "").strip(),
                        "soil_moisture_pct": col_texts[2].replace("%", "").strip(),
                    }
                    stations.append(normalize_station_telemetry(station_dict))
                except Exception:
                    pass

    return stations


def fetch_live_agrodat_data(
    api_endpoint: Optional[str] = None,
    timeout: float = 3.0
) -> Optional[List[Dict[str, Any]]]:
    """
    Interoghează live platforma https://agrodat.md și API-ul de telemetrie.
    Returnează lista de stații cu parametri normalizați sau None la eșec/timeout.
    """
    url = api_endpoint or settings.AGRODAT_API_ENDPOINT
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AgriTechMoldova/1.0",
        "Accept": "application/json, text/html, */*"
    }

    try:
        with httpx.Client(timeout=timeout, verify=False, follow_redirects=True) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "")
                if "application/json" in content_type:
                    body = resp.json()
                    stations_raw = body if isinstance(body, list) else body.get("stations", body.get("data", []))
                    if isinstance(stations_raw, list) and len(stations_raw) > 0:
                        logger.info(f"S-au extras live {len(stations_raw)} stații din JSON agrodat.md.")
                        return [normalize_station_telemetry(st) for st in stations_raw]
                else:
                    # Răspuns HTML: parsare cu BeautifulSoup
                    parsed_stations = parse_agrodat_html_telemetry(resp.text)
                    if parsed_stations:
                        logger.info(f"S-au extras live {len(parsed_stations)} stații din HTML agrodat.md.")
                        return parsed_stations

    except Exception as exc:
        logger.warning(
            f"Platforma agrodat.md ({url}) indisponibilă sau protejată: {exc}. "
            "Se comută automat pe fallback-ul garantat din moldova_stations.json."
        )

    return None


def load_fallback_stations() -> List[Dict[str, Any]]:
    """Încarcă stațiile de rezervă garantate din moldova_stations.json."""
    seed_file = Path(__file__).parent / "seed" / "moldova_stations.json"
    if seed_file.exists():
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [normalize_station_telemetry(s) for s in data]
    logger.error(f"Fișierul fallback {seed_file} nu a fost găsit!")
    return []


def get_available_stations(force_fallback: bool = False) -> List[Dict[str, Any]]:
    """
    Obține lista completă de stații agrometeorologice din Moldova:
    1. Încearcă interogarea live pe platforma agrodat.md.
    2. Comută pe fallback-ul local moldova_stations.json în caz de indisponibilitate.
    """
    stations = None
    if not force_fallback:
        stations = fetch_live_agrodat_data()

    if not stations:
        stations = load_fallback_stations()

    return stations


def fetch_telemetry_for_station(
    station_id: str = "agro-st-chisinau-01",
    distance_km: float = 4.2
) -> ClimateTelemetry:
    """
    Extrage parametrii agrometeo din agrodat.md pentru o stație dată
    și generează contractul Pydantic ClimateTelemetry.
    """
    stations = get_available_stations()
    station = next((s for s in stations if s["id"] == station_id), None)

    if not station and stations:
        station = stations[0]

    if station:
        return ClimateTelemetry(
            nearest_station_id=station["id"],
            distance_km=round(distance_km, 1),
            soil_moisture_pct=float(station["soil_moisture_pct"]),
            leaf_wetness_hours=float(station["leaf_wetness_hours"]),
            precipitation_last_30d_mm=float(station["precipitation_last_30d_mm"]),
            eto_evapotranspiration_mm=float(station["eto_evapotranspiration_mm"])
        )

    # Fallback standard de siguranță
    return ClimateTelemetry(
        nearest_station_id="agro-st-chisinau-01",
        distance_km=4.2,
        soil_moisture_pct=42.0,
        leaf_wetness_hours=3.5,
        precipitation_last_30d_mm=28.0,
        eto_evapotranspiration_mm=4.5
    )


async def sync_telemetry_to_database(
    stations: Optional[List[Dict[str, Any]]] = None,
    db_url: Optional[str] = None
) -> int:
    """
    Persistă catalogul stațiilor și măsurătorile curente în baza de date PostgreSQL:
    1. Actualizează tabela weather_stations (is_active, locație, metadate).
    2. Inserează un nou rând de măsurători în tabela agro_weather_telemetry (WeatherTelemetryRecord).
    3. Prinde graceful orice eroare de conexiune la DB dacă PostgreSQL nu rulează.
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select

    station_list = stations if stations is not None else get_available_stations()
    if not station_list:
        logger.warning("Nu există stații disponibile pentru persistență.")
        return 0

    target_url = db_url or settings.DATABASE_URL
    logger.info(f"Inițiere persistență telemetrie pentru {len(station_list)} stații în DB: {target_url}")

    engine = None
    persisted_count = 0
    try:
        engine = create_async_engine(target_url, future=True)
        session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

        async with session_factory() as session:
            async with session.begin():
                for st in station_list:
                    st_id = st["id"]
                    # 1. Upsert WeatherStation
                    query = select(WeatherStation).where(WeatherStation.id == st_id)
                    res = await session.execute(query)
                    existing_ws = res.scalar_one_or_none()

                    if existing_ws:
                        existing_ws.name = st["name"]
                        existing_ws.region = st["region"]
                        existing_ws.latitude = st["latitude"]
                        existing_ws.longitude = st["longitude"]
                        existing_ws.elevation_m = st["elevation_m"]
                        existing_ws.is_active = st["is_active"]
                    else:
                        new_ws = WeatherStation(
                            id=st_id,
                            name=st["name"],
                            region=st["region"],
                            latitude=st["latitude"],
                            longitude=st["longitude"],
                            elevation_m=st["elevation_m"],
                            is_active=st["is_active"]
                        )
                        session.add(new_ws)

                    # 2. Inserare WeatherTelemetryRecord
                    telemetry_row = WeatherTelemetryRecord(
                        station_id=st_id,
                        recorded_at=datetime.utcnow(),
                        air_temp_c=st.get("air_temp_c"),
                        soil_temp_10cm_c=st.get("soil_temp_10cm_c"),
                        soil_moisture_percentage=st.get("soil_moisture_pct"),
                        leaf_wetness_minutes=st.get("leaf_wetness_minutes"),
                        solar_radiation_w_m2=st.get("solar_radiation_w_m2"),
                        precipitation_mm=st.get("precipitation_last_30d_mm"),
                        et0_evapotranspiration_mm=st.get("eto_evapotranspiration_mm")
                    )
                    session.add(telemetry_row)
                    persisted_count += 1

            await session.commit()
            logger.info(f"Persistență telemetrie finalizată cu succes: {persisted_count} înregistrări salvate.")

    except Exception as db_err:
        logger.warning(
            f"Baza de date PostgreSQL nu este accesibilă ({db_err}). "
            "Pipeline-ul continuă în mod autonom fără întreruperea API-ului."
        )
        return 0
    finally:
        if engine:
            await engine.dispose()

    return persisted_count


def sync_telemetry_to_database_sync(
    stations: Optional[List[Dict[str, Any]]] = None,
    db_url: Optional[str] = None
) -> int:
    """Wrapper sincron pentru persistența datelor în PostgreSQL."""
    import asyncio
    return asyncio.run(sync_telemetry_to_database(stations=stations, db_url=db_url))
