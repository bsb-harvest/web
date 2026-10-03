"""
Matricea de pretabilitate ecologică a culturilor.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.2: Calcul scor de pretabilitate (0 - 100 puncte).
"""

from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CropProfile


def calculate_suitability_score(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry
) -> int:
    """
    Calculează scorul de potrivire ecologică (0 - 100%) pentru o cultură pe o parcelă dată.
    """
    score = 100.0

    # 1. Evaluare pH sol
    if crop.optimal_ph_min <= soil.ph <= crop.optimal_ph_max:
        ph_factor = 1.0
    else:
        # Deviație de la intervalul optim
        deviation = min(
            abs(soil.ph - crop.optimal_ph_min),
            abs(soil.ph - crop.optimal_ph_max)
        )
        ph_factor = max(0.4, 1.0 - (deviation * 0.25))
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

    # 4. Evaluare Factor Hidric și Rezistență la Secetă
    # Umiditatea optimă a solului este în jur de 45-60%
    if climate.soil_moisture_pct < 35.0:
        if crop.drought_tolerance == "sensibila":
            # Ex: Porumbul sau Soia suferă masiv la secetă
            score *= 0.72
        elif crop.drought_tolerance == "medie":
            score *= 0.85
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
