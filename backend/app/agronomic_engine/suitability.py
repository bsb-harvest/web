"""
Matricea de pretabilitate ecologică a culturilor.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.2: Calcul scor de pretabilitate (0 - 100 puncte), diferențiat pe culturi.

Scorul pleacă de la 100 și se ajustează multiplicativ cu factori în funcție de:
  * pH-ul solului (interval optim + toleranță + penalizare mică lângă margine);
  * conținutul de humus;
  * gradul de eroziune;
  * deficitul hidric relativ al culturii (FAO-33: kc_mid, ky, raportul ETa/ETc),
    modulat de toleranța la secetă;
  * nota de bonitate.
Rezultatul final este limitat strict la [10, 98].
"""

import logging

from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CropProfile
from app.agronomic_engine.yield_calculator import relative_water_deficit

logger = logging.getLogger(__name__)

# pH: penalizare mică dacă pH-ul e în optim, dar la mai puțin de PH_EDGE_MARGIN de margine.
PH_EDGE_MARGIN = 0.3
PH_EDGE_PENALTY = 0.05

# Ponderea penalizării hidrice fiziologice (scalează ky × deficit).
WATER_DEFICIT_WEIGHT = 0.5
# Ponderea bonus/penalizare după toleranța la secetă (scalată cu deficitul).
DROUGHT_TOLERANCE_WEIGHT = 0.25
# Semnul ajustării: culturile tolerante la secetă primesc bonus, cele sensibile penalizare.
_DROUGHT_SIGN = {"ridicata": 1.0, "medie": 0.0, "scazuta": -1.0}


def calculate_suitability_score(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry
) -> int:
    """
    Calculează scorul de potrivire ecologică (0 - 100%) pentru o cultură pe o parcelă dată.
    """
    score = 100.0

    # 1. Evaluare pH sol pe baza intervalului optim și a toleranței (Task 4.1)
    if crop.ph_optimal_min <= soil.ph <= crop.ph_optimal_max:
        # În optim: penalizare mică dacă pH-ul e aproape de margine (risc de a ieși din interval).
        margin = min(soil.ph - crop.ph_optimal_min, crop.ph_optimal_max - soil.ph)
        if margin < PH_EDGE_MARGIN:
            ph_factor = 1.0 - PH_EDGE_PENALTY * (1.0 - margin / PH_EDGE_MARGIN)
        else:
            ph_factor = 1.0
    else:
        # Abaterea față de cea mai apropiată limită a intervalului optim
        deviation = min(
            abs(soil.ph - crop.ph_optimal_min),
            abs(soil.ph - crop.ph_optimal_max)
        )
        if deviation <= crop.ph_tolerance:
            # În limita de toleranță: penalizare ușoară
            ph_factor = max(0.75, 1.0 - (deviation * 0.15))
            logger.warning(
                "pH-ul solului (%.1f) este în afara intervalului optim (%.1f-%.1f) pentru %s, "
                "dar în limita de toleranță (±%.1f) — pretabilitate ușor redusă.",
                soil.ph, crop.ph_optimal_min, crop.ph_optimal_max, crop.name, crop.ph_tolerance
            )
        else:
            # Peste limita de toleranță: penalizare severă
            ph_factor = max(0.4, 1.0 - (deviation * 0.25))
            logger.warning(
                "pH-ul solului (%.1f) depășește toleranța pentru %s (optim %.1f-%.1f, toleranță ±%.1f) "
                "— pretabilitate redusă semnificativ; se recomandă corectarea reacției solului.",
                soil.ph, crop.name, crop.ph_optimal_min, crop.ph_optimal_max, crop.ph_tolerance
            )
    score *= ph_factor

    # 2. Evaluare Humus
    if soil.humus_pct < crop.min_humus_pct:
        humus_deficit = crop.min_humus_pct - soil.humus_pct
        humus_factor = max(0.5, 1.0 - (humus_deficit * 0.15))
        score *= humus_factor

    # 3. Penalizare Eroziune
    erosion_penalties = {
        "lipsa": 1.0,
        "slab": 0.95,
        "moderat": 0.82,
        "puternic": 0.65
    }
    score *= erosion_penalties.get(soil.erosion_grade, 0.90)

    # 4. Deficit hidric relativ al culturii (FAO-33), modulat de toleranța la secetă (Task 4.2).
    # Folosim același bilanț hidric ca motorul de randament (kc_mid, ETo, precipitații, umiditate),
    # deci o cultură cu consum mare de apă (kc_mid ridicat) sau sensibilă (ky mare) este penalizată gradual.
    deficit = relative_water_deficit(
        crop,
        climate.eto_evapotranspiration_mm,
        climate.precipitation_last_30d_mm,
        climate.soil_moisture_pct,
    )
    water_factor = 1.0 - WATER_DEFICIT_WEIGHT * crop.ky * deficit
    tol_sign = _DROUGHT_SIGN.get(crop.drought_tolerance, 0.0)
    drought_modifier = 1.0 + DROUGHT_TOLERANCE_WEIGHT * tol_sign * deficit
    score *= water_factor * drought_modifier
    if deficit > 0.0 and tol_sign < 0.0:
        logger.warning(
            "Cultura %s este sensibilă la secetă, iar parcela prezintă un deficit hidric relativ de %.0f%% "
            "— pretabilitate redusă; se recomandă irigare sau o cultură mai rezistentă.",
            crop.name, deficit * 100.0
        )

    # 5. Textura solului (crop.suitable_textures) este intenționat IGNORATĂ:
    # SoilProfile (schemas.py) nu expune un câmp de textură, iar schema nu se modifică aici.
    # Când se va adăuga `texture` în SoilProfile, aici se va aplica o penalizare pentru
    # texturile nepretabile (crop.suitable_textures), fără alte schimbări de structură.

    # 6. Corelare cu Nota de Bonitate a solului
    # Bonitate 80-100 = excelent, 60-79 = bun, sub 50 = slab
    bonitate_factor = 0.6 + (soil.bonitate_points / 250.0)  # [0.6 - 1.0]
    score *= bonitate_factor

    # Limitare strictă între 10 și 98 (evităm 100 absolut în agricultură reală)
    final_score = int(round(max(10.0, min(98.0, score))))
    return final_score
