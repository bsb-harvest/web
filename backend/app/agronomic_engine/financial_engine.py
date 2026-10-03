"""
Modulul financiar și de rentabilitate economică (MDL/ha).
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.4: Calcul costuri detaliate, venit brut și profit net per hectar.
"""

from typing import Tuple
from app.models.schemas import SoilProfile, ClimateTelemetry, EstimatedYield, ProductionCostBreakdown
from app.agronomic_engine.crops_database import CropProfile


def calculate_crop_finances(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry,
    yield_est: EstimatedYield
) -> Tuple[ProductionCostBreakdown, float, float, float]:
    """
    Calculează devizul de costuri per hectar, venitul brut estimat și profitul net în lei moldovenești (MDL).
    Returnează: (cost_breakdown, total_cost_mdl, gross_revenue_mdl, net_profit_mdl)
    """
    # 1. Cost Semințe (fix sau ușor ajustat la densitate)
    seeds_cost = crop.base_seed_cost_mdl

    # 2. Cost Îngrășăminte NPK
    # Dacă solul are humus scăzut (< 3.0%), este necesară o cantitate suplimentară de NPK
    humus_adjustment = 1.0
    if soil.humus_pct < 2.5:
        humus_adjustment = 1.20
    elif soil.humus_pct > 3.5:
        humus_adjustment = 0.90
    fertilizer_cost = round(crop.base_fertilizer_cost_mdl * humus_adjustment, 2)

    # 3. Cost Motorină și Carburanți
    # Pe terenuri erodate sau cu relief accidentat, consumul crește cu 10-15%
    fuel_multiplier = 1.0
    if soil.erosion_grade in ["moderat", "puternic"]:
        fuel_multiplier = 1.15
    fuel_cost = round(crop.base_fuel_cost_mdl * fuel_multiplier, 2)

    # 4. Tratamente Fitosanitare (Pesticide, Fungicide, Erbicide)
    # Dacă umiditatea pe frunză este ridicată (> 4 ore), crește necesarul de fungicide
    pesticide_multiplier = 1.0
    if climate.leaf_wetness_hours > 4.0:
        pesticide_multiplier = 1.25  # Necesită tratament fungic suplimentar
    pesticide_cost = round(crop.base_pesticide_cost_mdl * pesticide_multiplier, 2)

    # 5. Lucrări Mecanizate și Manoperă
    mechanized_cost = crop.base_mechanized_cost_mdl

    # Cost Total Investiție per Hectar (MDL/ha)
    total_cost_mdl = round(
        seeds_cost + fertilizer_cost + fuel_cost + pesticide_cost + mechanized_cost,
        2
    )

    breakdown = ProductionCostBreakdown(
        seeds_mdl=seeds_cost,
        fertilizers_mdl=fertilizer_cost,
        fuel_diesel_mdl=fuel_cost,
        pesticides_mdl=pesticide_cost,
        mechanized_labor_mdl=mechanized_cost,
        total_cost_mdl=total_cost_mdl
    )

    # 6. Venit Brut Estimat (MDL/ha)
    # Folosim media recoltei prognozate
    avg_yield = (yield_est.min_t_ha + yield_est.max_t_ha) / 2.0
    gross_revenue_mdl = round(avg_yield * crop.market_price_mdl_per_ton, 2)

    # 7. Profit Net Estimat (MDL/ha)
    net_profit_mdl = round(gross_revenue_mdl - total_cost_mdl, 2)

    return breakdown, total_cost_mdl, gross_revenue_mdl, net_profit_mdl
