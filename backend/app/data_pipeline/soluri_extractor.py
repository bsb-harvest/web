"""
Extractor și adaptor pentru soluri.gov.md (Geoportal Moldova).
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.1 & Task 3.2: Extragere, clasificare, normalizare și intersecție spațială a profilului de sol din Moldova.
"""

import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import httpx
from shapely.geometry import shape, Point

from app.core.config import settings
from app.models.schemas import SoilProfile

logger = logging.getLogger("SoluriExtractor")

# Valori de referință și medii pedologice pentru solurile din Republica Moldova
# (conform Institutului de Pedologie, Agrochimie și Protecție a Solului „Nicolae Dimo”)
PEDOLOGICAL_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "cernoziom levigat": {
        "soil_type": "Cernoziom levigat Bălți/Nord",
        "bonitate_points": 84,
        "humus_pct": 4.2,
        "ph": 6.8,
        "erosion_grade": "slab"
    },
    "cernoziom tipic": {
        "soil_type": "Cernoziom tipic Chișinău/Centru",
        "bonitate_points": 76,
        "humus_pct": 3.8,
        "ph": 7.2,
        "erosion_grade": "slab"
    },
    "soluri cenusii": {
        "soil_type": "Soluri cenușii Codru/Orhei",
        "bonitate_points": 62,
        "humus_pct": 2.9,
        "ph": 6.2,
        "erosion_grade": "moderat"
    },
    "cernoziom carbonatic": {
        "soil_type": "Cernoziom carbonatic Cahul/Sud",
        "bonitate_points": 68,
        "humus_pct": 3.1,
        "ph": 7.8,
        "erosion_grade": "moderat"
    },
    "soluri aluviale": {
        "soil_type": "Soluri aluviale de luncă Prut/Nistru",
        "bonitate_points": 70,
        "humus_pct": 3.2,
        "ph": 7.4,
        "erosion_grade": "lipsa"
    }
}

GENERAL_PEDOLOGICAL_DEFAULT: Dict[str, Any] = {
    "soil_type": "Cernoziom tipic moderat humifer",
    "bonitate_points": 70,
    "humus_pct": 3.5,
    "ph": 7.0,
    "erosion_grade": "slab"
}

# Baza de cunoștințe a profilurilor pedologice tipice din Moldova (fallback regional)
MOLDOVA_SOIL_REGIONS = [
    {
        "region": "Nord (Bălți, Edineț, Soroca)",
        "lat_min": 47.6,
        "lat_max": 48.5,
        "soil": SoilProfile(
            type="Cernoziom levigat și tipic lutos",
            bonitate_points=84,
            humus_pct=4.2,
            ph=6.8,
            erosion_grade="slab"
        )
    },
    {
        "region": "Centru (Chișinău, Orhei, Strășeni)",
        "lat_min": 46.8,
        "lat_max": 47.6,
        "soil": SoilProfile(
            type="Cernoziom tipic moderat humifer",
            bonitate_points=76,
            humus_pct=3.8,
            ph=7.2,
            erosion_grade="slab"
        )
    },
    {
        "region": "Sud (Cahul, Comrat, Vulcănești)",
        "lat_min": 45.4,
        "lat_max": 46.8,
        "soil": SoilProfile(
            type="Cernoziom carbonatic și xerofitic de stepă",
            bonitate_points=68,
            humus_pct=3.1,
            ph=7.8,
            erosion_grade="moderat"
        )
    }
]


def _normalize_string(text: str) -> str:
    """Normalizează textul eliminând diacriticele și convertind la litere mici."""
    t = text.lower().strip()
    replacements = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't'
    }
    for k, v in replacements.items():
        t = t.replace(k, v)
    return t


def find_pedological_benchmark(soil_type_raw: Optional[str]) -> Dict[str, Any]:
    """Identifică profilul mediu de referință după denumirea tipului de sol."""
    if not soil_type_raw:
        return GENERAL_PEDOLOGICAL_DEFAULT
    norm = _normalize_string(str(soil_type_raw))
    if "cenusi" in norm or "padure" in norm or "codru" in norm:
        return PEDOLOGICAL_DEFAULTS["soluri cenusii"]
    elif "carbonatic" in norm or "cahul" in norm:
        return PEDOLOGICAL_DEFAULTS["cernoziom carbonatic"]
    elif "levigat" in norm or "balti" in norm:
        return PEDOLOGICAL_DEFAULTS["cernoziom levigat"]
    elif "aluvial" in norm or "lunca" in norm or "prut" in norm or "nistru" in norm:
        return PEDOLOGICAL_DEFAULTS["soluri aluviale"]
    elif "tipic" in norm or "chisinau" in norm or "cernoziom" in norm:
        return PEDOLOGICAL_DEFAULTS["cernoziom tipic"]
    return GENERAL_PEDOLOGICAL_DEFAULT


def clean_soil_record(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Curăță și normalizează un record pedologic:
    1. Completează valorile lipsă de pH sau humus cu mediile pedologice ale tipului respectiv de sol.
    2. Validează nota de bonitate între 1 și 100 puncte.
    3. Normalizează gradele de eroziune la valorile acceptate: 'lipsa', 'slab', 'moderat', 'puternic'.
    """
    raw_type = data.get("soil_type") or data.get("type")
    benchmark = find_pedological_benchmark(raw_type)

    if raw_type and str(raw_type).strip():
        soil_type = str(raw_type).strip()
    else:
        soil_type = benchmark["soil_type"]

    # 1. Validare și clamping bonitate (1 - 100 puncte)
    raw_bonitate = data.get("bonitate_points")
    if raw_bonitate is None:
        raw_bonitate = data.get("bonitate_score")
    if raw_bonitate is None:
        raw_bonitate = data.get("bonitate")

    if raw_bonitate is not None and str(raw_bonitate).strip() != "":
        try:
            val_b = int(round(float(raw_bonitate)))
            bonitate_points = max(1, min(100, val_b))
        except (ValueError, TypeError):
            bonitate_points = benchmark["bonitate_points"]
    else:
        bonitate_points = benchmark["bonitate_points"]

    # 2. Validare pH (completează lipsa cu media tipului de sol)
    raw_ph = data.get("ph")
    if raw_ph is None:
        raw_ph = data.get("ph_level")

    if raw_ph is not None and str(raw_ph).strip() != "":
        try:
            val_ph = float(raw_ph)
            if 3.0 <= val_ph <= 11.0:
                ph = round(val_ph, 1)
            else:
                ph = benchmark["ph"]
        except (ValueError, TypeError):
            ph = benchmark["ph"]
    else:
        ph = benchmark["ph"]

    # 3. Validare humus % (completează lipsa cu media tipului de sol)
    raw_humus = data.get("humus_pct")
    if raw_humus is None:
        raw_humus = data.get("humus_percentage")
    if raw_humus is None:
        raw_humus = data.get("humus")

    if raw_humus is not None and str(raw_humus).strip() != "":
        try:
            val_h = float(raw_humus)
            if 0.0 <= val_h <= 25.0:
                humus_pct = round(val_h, 2)
            else:
                humus_pct = benchmark["humus_pct"]
        except (ValueError, TypeError):
            humus_pct = benchmark["humus_pct"]
    else:
        humus_pct = benchmark["humus_pct"]

    # 4. Normalizare grad de eroziune
    raw_erosion = data.get("erosion_grade")
    if raw_erosion is None:
        raw_erosion = data.get("erosion")
    if raw_erosion is None:
        raw_erosion = data.get("eroziune")

    if raw_erosion is not None and str(raw_erosion).strip() != "":
        norm_e = _normalize_string(str(raw_erosion))
        if norm_e in ["lipsa", "fara", "neerodat", "neerodate", "none", "zero", "0"]:
            erosion_grade = "lipsa"
        elif norm_e in ["slab", "slaba", "redus", "redusa", "usor", "mic", "scazut", "1"]:
            erosion_grade = "slab"
        elif norm_e in ["moderat", "moderata", "mediu", "medie", "2"]:
            erosion_grade = "moderat"
        elif norm_e in ["puternic", "puternica", "sever", "severa", "avansat", "avansata", "ridicat", "ridicata", "accentuat", "3"]:
            erosion_grade = "puternic"
        elif norm_e in ["lipsa", "slab", "moderat", "puternic"]:
            erosion_grade = norm_e
        else:
            erosion_grade = benchmark["erosion_grade"]
    else:
        erosion_grade = benchmark["erosion_grade"]

    cleaned: Dict[str, Any] = {
        "soil_type": soil_type,
        "bonitate_points": bonitate_points,
        "humus_pct": humus_pct,
        "ph": ph,
        "erosion_grade": erosion_grade,
        # Câmpuri compatibile cu ORM SoilProfileRecord
        "bonitate_score": bonitate_points,
        "humus_percentage": humus_pct,
        "ph_level": ph
    }

    # Păstrare metadate opționale
    for extra_key in ("id", "geometry", "geom", "geom_wkt"):
        if extra_key in data:
            cleaned[extra_key] = data[extra_key]

    return cleaned


def fetch_wfs_soil_features(
    wfs_url: Optional[str] = None,
    timeout: float = 3.0
) -> Optional[List[Dict[str, Any]]]:
    """
    Interoghează Geoserver WFS (https://soluri.gov.md/geoserver/wfs).
    Returnează entitățile GeoJSON sau None dacă serviciul este indisponibil.
    """
    url = wfs_url or settings.SOLURI_WFS_ENDPOINT
    params = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "outputFormat": "application/json",
        "typeName": "soluri:soluri_moldova",
        "srsName": "EPSG:4326"
    }

    try:
        with httpx.Client(timeout=timeout, verify=False) as client:
            resp = client.get(url, params=params)
            if resp.status_code == 200:
                body = resp.json()
                features = body.get("features", [])
                if isinstance(features, list) and len(features) > 0:
                    logger.info(f"S-au extras {len(features)} poligoane pedologice de pe WFS Geoserver.")
                    return features
    except Exception as exc:
        logger.warning(f"Geoportal WFS ({url}) indisponibil: {exc}. Se activează fallback-ul pe GeoJSON local.")

    return None


def load_seed_soil_features() -> List[Dict[str, Any]]:
    """Încarcă poligoanele de sol de rezervă din seed-ul GeoJSON local."""
    seed_file = Path(__file__).parent / "seed" / "moldova_soils.geojson"
    if seed_file.exists():
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("features", [])
    logger.error(f"Fișierul seed {seed_file} nu a fost găsit!")
    return []


def get_soil_features(force_fallback: bool = False) -> List[Dict[str, Any]]:
    """
    Obține lista completă de entități de sol (WFS cu fallback automat pe GeoJSON seed).
    Toate atributele sunt curățate și normalizate via clean_soil_record.
    """
    raw_features = None
    if not force_fallback:
        raw_features = fetch_wfs_soil_features()

    if not raw_features:
        raw_features = load_seed_soil_features()

    cleaned_features = []
    for f in raw_features:
        props = f.get("properties", {})
        cleaned_props = clean_soil_record(props)
        cleaned_features.append({
            "type": "Feature",
            "id": f.get("id"),
            "geometry": f.get("geometry"),
            "properties": cleaned_props
        })

    return cleaned_features


# Cache în memorie pentru poligoane Shapely parsate
_SPATIAL_POLYGONS_CACHE: Optional[List[Tuple[Any, Dict[str, Any]]]] = None


def get_spatial_soil_polygons(reload: bool = False) -> List[Tuple[Any, Dict[str, Any]]]:
    """Returnează lista cached de tupluri (shapely_geom, cleaned_properties)."""
    global _SPATIAL_POLYGONS_CACHE
    if _SPATIAL_POLYGONS_CACHE is not None and not reload:
        return _SPATIAL_POLYGONS_CACHE

    features = get_soil_features()
    polygons = []
    for f in features:
        geom_json = f.get("geometry")
        if not geom_json:
            continue
        try:
            geom_obj = shape(geom_json)
            props = f.get("properties", {})
            polygons.append((geom_obj, props))
        except Exception as exc:
            logger.warning(f"Nu s-a putut parsa geometria Shapely: {exc}")

    _SPATIAL_POLYGONS_CACHE = polygons
    return _SPATIAL_POLYGONS_CACHE


def extract_soil_profile_by_coordinates(lat: float, lng: float) -> SoilProfile:
    """
    Identifică profilul pedologic al solului corespunzător coordonatelor GPS din Moldova:
    1. Execută intersecția spațială punct-în-poligon (Shapely Point(lng, lat)).
    2. Dacă punctul nu este acoperit de poligoane cartate, apelează fallback-ul regional MOLDOVA_SOIL_REGIONS.
    3. Dacă este în afara Moldovei, returnează profilul implicit central.
    """
    pt = Point(lng, lat)
    spatial_polygons = get_spatial_soil_polygons()

    for geom, props in spatial_polygons:
        if geom.contains(pt) or geom.intersects(pt):
            cleaned = clean_soil_record(props)
            return SoilProfile(
                type=cleaned["soil_type"],
                bonitate_points=cleaned["bonitate_points"],
                humus_pct=cleaned["humus_pct"],
                ph=cleaned["ph"],
                erosion_grade=cleaned["erosion_grade"]
            )

    # Fallback regional pe latitudini
    for entry in MOLDOVA_SOIL_REGIONS:
        if entry["lat_min"] <= lat <= entry["lat_max"]:
            return entry["soil"]

    # Profil implicit (Cernoziom specific zonei centrale)
    return SoilProfile(
        type="Cernoziom tipic moderat humifer",
        bonitate_points=76,
        humus_pct=3.8,
        ph=7.2,
        erosion_grade="slab"
    )
