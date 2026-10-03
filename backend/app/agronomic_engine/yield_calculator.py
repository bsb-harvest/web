"""
Algoritmul determinist de prognoză a randamentului recoltei (t/ha).
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.2/4.3: Formulă explicită de randament bazată pe bilanțul hidric FAO-33.

Formula principală:

    Recoltă = Randament_Bază(bonitate) × F_apă × F_termic × F_eroziune

unde:
  * Randament_Bază = bonitate_points × base_bonitate_yield_ratio   [t/ha în condiții optime]
  * F_apă  (FAO-33):  ETc = kc_mid × ETo × fereastră_zile
                      ETa = min(ETc, precipitații + aport_umiditate_sol)
                      F_apă = 1 − ky × (1 − ETa/ETc)
  * F_termic: proxy pentru stresul termic (ETo mare + precipitații mici), deoarece
              ClimateTelemetry nu conține temperatura aerului; acceptă opțional
              `air_temp_c` fără a modifica schemas.py.
  * F_eroziune: coeficient de penalizare în funcție de gradul de eroziune al solului.

Toți factorii sunt limitați la intervalul [0.2, 1.0].

Banda de producție returnată:
  * max_t_ha = scenariul unui an OPTIM (fără deficit hidric/termic: F_apă = F_termic = 1.0)
  * min_t_ha = scenariul unui an SECETOS (precipitații × 0.5, ETo × 1.2)
"""

from typing import Optional
from app.models.schemas import SoilProfile, ClimateTelemetry, EstimatedYield
from app.agronomic_engine.crops_database import CropProfile


# Rezerva utilă de apă din zona radiculară 0-100 cm (mm), proxy pentru sol lutos de tip cernoziom.
ROOT_ZONE_AWC_MM = 150.0
# Fereastra temporală pe care comparăm consumul culturii (ETc) cu precipitațiile cumulate (30 zile).
WATER_BALANCE_WINDOW_DAYS = 30

# Penalizarea randamentului în funcție de gradul de eroziune a solului.
EROSION_FACTORS = {
    "lipsa": 1.0,
    "slab": 0.95,
    "moderat": 0.85,
    "puternic": 0.70,
}


def _clamp(value: float, low: float = 0.2, high: float = 1.0) -> float:
    """Limitează un factor multiplicativ la intervalul [low, high]."""
    return max(low, min(high, value))


def _water_factor(
    crop: CropProfile,
    eto_mm_day: float,
    precipitation_mm: float,
    soil_moisture_pct: float,
) -> float:
    """
    Factorul hidric după FAO-33:

        ETc   = kc_mid × ETo × fereastră_zile        (necesarul de apă al culturii, mm)
        aport = (umiditate_sol% / 100) × AWC_zonă_radiculară   (mm)
        ETa   = min(ETc, precipitații + aport)       (apa efectiv consumată, mm)
        F_apă = 1 − ky × (1 − ETa/ETc)

    Rezultatul este limitat la [0.2, 1.0].
    """
    etc = crop.kc_mid * eto_mm_day * WATER_BALANCE_WINDOW_DAYS
    if etc <= 0:
        return 1.0
    soil_supply = (soil_moisture_pct / 100.0) * ROOT_ZONE_AWC_MM
    eta = min(etc, precipitation_mm + soil_supply)
    f_water = 1.0 - crop.ky * (1.0 - eta / etc)
    return _clamp(f_water)


def _thermal_factor(
    eto_mm_day: float,
    precipitation_mm: float,
    air_temp_c: Optional[float] = None,
) -> float:
    """
    Factorul termic.

    Deoarece ClimateTelemetry nu conține temperatura aerului, folosim un proxy:
    un ETo ridicat (> 5 mm/zi) combinat cu precipitații reduse (< 20 mm/30 zile)
    semnalează stres termic/hidric și reduce randamentul.

    Dacă se furnizează explicit `air_temp_c`, aplicăm o penalizare liniară pentru
    temperaturi extreme (> 30 °C sau < 5 °C). Rezultatul este limitat la [0.2, 1.0].
    """
    if air_temp_c is not None:
        if air_temp_c > 30.0:
            return _clamp(1.0 - (air_temp_c - 30.0) * 0.03)
        if air_temp_c < 5.0:
            return _clamp(1.0 - (5.0 - air_temp_c) * 0.03)
        return 1.0

    if eto_mm_day > 5.0 and precipitation_mm < 20.0:
        return _clamp(0.88)
    return 1.0


def calculate_crop_yield(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry,
    air_temp_c: Optional[float] = None,
) -> EstimatedYield:
    """
    Calculează intervalul realist de recoltă (min_t_ha, max_t_ha) conform formulei:

        Recoltă = Randament_Bază(bonitate) × F_apă × F_termic × F_eroziune

    * max_t_ha — scenariul unui an OPTIM: fără deficit hidric sau termic
      (F_apă = 1.0, F_termic = 1.0), eroziunea rămânând o proprietate permanentă a solului.
    * min_t_ha — scenariul unui an SECETOS: precipitațiile scad la jumătate
      (× 0.5) și evapotranspirația crește (ETo × 1.2), ceea ce reduce F_apă (FAO-33)
      și poate declanșa factorul de stres termic.

    Parametrul opțional `air_temp_c` permite rafinarea factorului termic fără a
    modifica contractul de date (schemas.py). Output-ul rămâne EstimatedYield.
    """
    # 1. Randament de bază determinat de bonitatea solului (calibrare păstrată)
    base_yield = soil.bonitate_points * crop.base_bonitate_yield_ratio

    # 2. Factorul de eroziune (proprietate permanentă a parcelei, aplicat în ambele scenarii)
    f_erosion = _clamp(EROSION_FACTORS.get(soil.erosion_grade, 0.90))

    # 3. Scenariul AN OPTIM (fără deficit) -> max_t_ha
    expected_max = base_yield * 1.0 * 1.0 * f_erosion

    # 4. Scenariul AN SECETOS (precipitații × 0.5, ETo × 1.2) -> min_t_ha
    drought_precipitation = climate.precipitation_last_30d_mm * 0.5
    drought_eto = climate.eto_evapotranspiration_mm * 1.2
    f_water_dry = _water_factor(
        crop, drought_eto, drought_precipitation, climate.soil_moisture_pct
    )
    f_thermal_dry = _thermal_factor(drought_eto, drought_precipitation, air_temp_c)
    expected_min = base_yield * f_water_dry * f_thermal_dry * f_erosion

    # 5. Compunerea benzii de producție (min ≤ max, cu o marjă minimă de siguranță)
    min_yield = round(max(0.5, expected_min), 2)
    max_yield = round(max(min_yield + 0.3, expected_max), 2)

    return EstimatedYield(min_t_ha=min_yield, max_t_ha=max_yield)
