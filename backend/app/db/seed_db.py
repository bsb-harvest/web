"""
Script de populare inițială (Seed) a bazei de date Aiven PostgreSQL / PostGIS.
AgriTech AI Guidance Moldova
Persoana 2 (Backend Core) & Persoana 3 (Data Pipeline)
"""

import json
import uuid
import datetime
from pathlib import Path
import psycopg2
from app.core.config import settings

def seed_database():
    print("=== Conectare la baza de date Aiven PostgreSQL ===")
    conn = psycopg2.connect(
        dbname="defaultdb",
        user="${POSTGRES_USER}",
        password="${POSTGRES_PASSWORD}",
        host="${POSTGRES_HOST}",
        port=20457,
        sslmode="require",
        sslrootcert="ca.pem"
    )
    cur = conn.cursor()

    # 1. Populare weather_stations (agrodat.md)
    print("\n--- 1. Populare stații agrometeorologice (weather_stations) ---")
    stations_seed_path = Path(__file__).resolve().parent.parent / "data_pipeline" / "seed" / "moldova_stations.json"
    with open(stations_seed_path, "r", encoding="utf-8") as f:
        stations = json.load(f)

    for s in stations:
        cur.execute("""
            INSERT INTO weather_stations (id, name, region, latitude, longitude, elevation_m, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                region = EXCLUDED.region,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                elevation_m = EXCLUDED.elevation_m,
                is_active = EXCLUDED.is_active;
        """, (
            s["id"],
            s["name"],
            s["region"],
            s["latitude"],
            s["longitude"],
            s.get("elevation_m", 100),
            1
        ))
        print(f"  ✓ Stație inserată/actualizată: [{s['id']}] {s['name']}")

    # 2. Populare telemetrie agrodat.md (agro_weather_telemetry)
    print("\n--- 2. Populare telemetrie meteo recentă (agro_weather_telemetry) ---")
    now = datetime.datetime.utcnow()
    for s in stations:
        # Adăugăm înregistrări de telemetrie pentru ultimele 3 intervale (istoric recent)
        for hours_ago in [0, 6, 12, 24]:
            rec_time = now - datetime.timedelta(hours=hours_ago)
            # Ușoară variație realistă în funcție de oră
            temp_var = 22.5 - (hours_ago * 0.4)
            soil_moist = s.get("soil_moisture_pct", 40.0) + (hours_ago * 0.1)
            leaf_wet = int(s.get("leaf_wetness_hours", 3.0) * 60)

            cur.execute("""
                INSERT INTO agro_weather_telemetry (
                    station_id, recorded_at, air_temp_c, soil_temp_10cm_c,
                    soil_moisture_percentage, leaf_wetness_minutes,
                    solar_radiation_w_m2, precipitation_mm, et0_evapotranspiration_mm
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                s["id"],
                rec_time,
                round(temp_var, 1),
                round(temp_var - 3.0, 1),
                round(soil_moist, 1),
                leaf_wet,
                450.0 if hours_ago in [0, 6] else 0.0,
                s.get("precipitation_last_30d_mm", 25.0),
                s.get("eto_evapotranspiration_mm", 4.0)
            ))
        print(f"  ✓ Telemetrie adăugată pentru stația: {s['id']}")

    # 3. Populare profile pedologice (soluri.gov.md)
    print("\n--- 3. Populare tipuri de soluri din Republica Moldova (soil_profiles) ---")
    soil_data = [
        ("Cernoziom levigat și tipic lutos (Nord)", 84, 4.2, 6.8, "slab"),
        ("Cernoziom tipic moderat humifer (Centru)", 76, 3.8, 7.2, "slab"),
        ("Cernoziom carbonatic și xerofitic de stepă (Sud)", 68, 3.1, 7.8, "moderat"),
        ("Cernoziom cambic profund (Zona de silvostepă)", 80, 4.0, 7.0, "lipsa"),
        ("Sol cenușiu de pădure (Codru)", 72, 3.2, 6.4, "slab"),
        ("Sol aluvial de luncă (Văile Prut și Nistru)", 78, 3.5, 7.4, "slab")
    ]

    # Curățăm profilurile vechi pentru a evita duplicate la reseeding
    cur.execute("DELETE FROM soil_profiles;")
    for soil_type, bonitate, humus, ph, erosion in soil_data:
        cur.execute("""
            INSERT INTO soil_profiles (soil_type, bonitate_score, humus_percentage, ph_level, erosion_grade, created_at)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (soil_type, bonitate, humus, ph, erosion, now))
        print(f"  ✓ Profil sol: {soil_type} (Bonitate: {bonitate}p, Humus: {humus}%, pH: {ph})")

    # 4. Populare parcele agricole demonstrative (parcels)
    print("\n--- 4. Populare parcele demonstrative (parcels) ---")
    sample_parcels = [
        {
            "name": "Parcela Chișinău Central (Demonstrativă)",
            "cadastral": "0100123456",
            "area_ha": 15.5,
            "wkt": "POLYGON((28.8300 47.0100, 28.8450 47.0100, 28.8450 47.0220, 28.8300 47.0220, 28.8300 47.0100))"
        },
        {
            "name": "Parcela Bălți Nord (Cernoziom)",
            "cadastral": "0300987654",
            "area_ha": 28.4,
            "wkt": "POLYGON((27.9150 47.7550, 27.9350 47.7550, 27.9350 47.7700, 27.9150 47.7700, 27.9150 47.7550))"
        },
        {
            "name": "Parcela Cahul Podiș (Sud)",
            "cadastral": "1700456123",
            "area_ha": 42.0,
            "wkt": "POLYGON((28.1800 45.8950, 28.2000 45.8950, 28.2000 45.9120, 28.1800 45.9120, 28.1800 45.8950))"
        },
        {
            "name": "Parcela Orhei Codru",
            "cadastral": "6400789456",
            "area_ha": 18.2,
            "wkt": "POLYGON((28.8100 47.3750, 28.8300 47.3750, 28.8300 47.3900, 28.8100 47.3900, 28.8100 47.3750))"
        }
    ]

    cur.execute("DELETE FROM parcels;")
    for p in sample_parcels:
        parcel_uuid = str(uuid.uuid4())
        # Folosim ST_GeomFromText dacă PostGIS e activ
        cur.execute("""
            INSERT INTO parcels (id, user_id, name, cadastral_number, area_hectares, geom, created_at)
            VALUES (%s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326), %s);
        """, (
            parcel_uuid,
            "demo-user-moldova",
            p["name"],
            p["cadastral"],
            p["area_ha"],
            p["wkt"],
            now
        ))
        print(f"  ✓ Parcelă salvată: {p['name']} ({p['area_ha']} ha, Cadastru: {p['cadastral']})")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Popularea bazei de date Aiven s-a finalizat cu succes!")

if __name__ == "__main__":
    seed_database()
