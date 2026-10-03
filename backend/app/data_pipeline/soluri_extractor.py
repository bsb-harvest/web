"""
Extractor și adaptor pentru soluri.gov.md (Geoportal Moldova).
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Task 3.1 & Task 3.2: Extragere, clasificare și normalizare a profilului de sol din Moldova.
"""

from typing import List
from app.models.schemas import SoilProfile


# Baza de cunoștințe a profilurilor pedologice tipice din Moldova
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


def extract_soil_profile_by_coordinates(lat: float, lng: float) -> SoilProfile:
    """
    Identifică profilul pedologic al solului corespunzător coordonatelor GPS din Moldova.
    """
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
