"""
Matricea de pretabilitate ecologică a culturilor.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.2: Calcul scor de pretabilitate (0 - 100 puncte).
"""

import logging

from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CropProfile

logger = logging.getLogger(__name__)


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

    # 4. Evaluare Factor Hidric și Toleranță la Secetă (Task 4.1)
    # Umiditatea optimă a solului este în jur de 45-60%
    if climate.soil_moisture_pct < 35.0:
        if crop.drought_tolerance == "scazuta":
            # Ex: Porumbul sau Soia suferă masiv la secetă
            score *= 0.72
            logger.warning(
                "Umiditatea solului (%.1f%%) este scăzută, iar %s are toleranță scăzută la secetă "
                "— risc major de pierdere de recoltă; se recomandă irigare sau altă cultură.",
                climate.soil_moisture_pct, crop.name
            )
        elif crop.drought_tolerance == "medie":
            score *= 0.85
            logger.warning(
                "Umiditatea solului (%.1f%%) este scăzută pentru %s (toleranță medie la secetă) "
                "— se recomandă monitorizarea rezervei de apă.",
                climate.soil_moisture_pct, crop.name
            )
        elif crop.drought_tolerance == "ridicata":
            # Ex: Floarea-soarelui sau Orzul rezistă mult mai bine
            score *= 0.94

    # 5. Corelare cu Nota de Bonitate a solului
    # Bonitate 80-100 = excelent, 60-79 = bun, sub 50 = slab
    bonitate_factor = 0.6 + (soil.bonitate_points / 250.0)  # [0.6 - 1.0]
    score *= bonitate_factor

    # Limitare strictă între 10 și 98 (evităm 100 absolut în agricultură reală)
    final_score = int(round(max(10.0, min(98.0, score))))
    return final_score
