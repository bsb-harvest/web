"""
Fațada principală a modulului Agronomic & Financiar.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.5: Funcția calculate_crop_economics() ce asamblează calculul complet.
"""

from typing import List, Optional
from app.models.schemas import SoilProfile, ClimateTelemetry, RecommendedCrop
from app.agronomic_engine.crops_database import CROPS_DATABASE, CropProfile
from app.agronomic_engine.suitability import calculate_suitability_score
from app.agronomic_engine.yield_calculator import calculate_crop_yield
from app.agronomic_engine.financial_engine import calculate_crop_finances


def calculate_crop_economics(
    soil: SoilProfile,
    climate: ClimateTelemetry,
    selected_crops: Optional[List[str]] = None
) -> List[RecommendedCrop]:
    """
    Calculează și ierarhizează culturile agricole pentru o parcelă,
    returnând lista completă a culturilor recomandate conform contractului comun de date.
    """
    results: List[RecommendedCrop] = []

    # Filtrăm culturile dacă s-a specificat o listă, altfel le evaluăm pe toate 6
    target_crops = CROPS_DATABASE.values()
    if selected_crops:
        target_crops = [
            crop for name, crop in CROPS_DATABASE.items()
            if name in selected_crops or crop.latin_name in selected_crops
        ]

    for crop in target_crops:
        # 1. Scorul de pretabilitate (0 - 100%)
        suitability = calculate_suitability_score(crop, soil, climate)

        # 2. Estimare Randament (min - max tone/ha)
        yield_estimate = calculate_crop_yield(crop, soil, climate)

        # 3. Deviz Financiar (Cost, Venit, Profit in MDL/ha)
        breakdown, total_cost, revenue, net_profit = calculate_crop_finances(
            crop, soil, climate, yield_estimate
        )

        results.append(
            RecommendedCrop(
                crop_name=crop.name,
                suitability_score=suitability,
                estimated_yield=yield_estimate,
                estimated_costs_mdl_ha=total_cost,
                estimated_revenue_mdl_ha=revenue,
                net_profit_mdl_ha=net_profit,
                cost_breakdown=breakdown
            )
        )

    # Sortăm descrescător după scorul de potrivire și profitabilitate
    results.sort(key=lambda x: (x.suitability_score, x.net_profit_mdl_ha), reverse=True)
    return results
