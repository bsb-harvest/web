"""
Modulul financiar și de rentabilitate economică (MDL/ha).
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.3/4.4: Deviz de costuri pe categorii, venit, profit net, prag de
rentabilitate (t/ha) și marjă (%), pentru recolta minimă și maximă.

Categoriile de cost (MDL/ha) urmează structura cerută de task:
  1. Semințe & material semincer            -> seeds_mdl
  2. Îngrășăminte (azotat de amoniu, NPK)    -> fertilizers_mdl
  3. Carburant & lucrări mecanizate          -> fuel_diesel_mdl + mechanized_labor_mdl
     (arat, semănat, recoltat)
  4. Tratamente de protecție                 -> pesticides_mdl
     (erbicide, fungicide, insecticide)

Notă: fuel_diesel_mdl și mechanized_labor_mdl rămân câmpuri separate în
ProductionCostBreakdown pentru compatibilitate cu frontend-ul (CropCardsGrid
le afișează distinct), deși conceptual fac parte din aceeași categorie.
"""

from typing import Tuple
from pydantic import BaseModel, Field

from app.models.schemas import (
    SoilProfile,
    ClimateTelemetry,
    EstimatedYield,
    ProductionCostBreakdown,
)
from app.agronomic_engine.crops_database import CropProfile, SourceRef


class CropFinancials(BaseModel):
    """
    Imaginea financiară completă a unei culturi pe o parcelă (MDL/ha).

    Conține metrici care NU au încă un câmp în schemas.py (prag de rentabilitate,
    marjă %, venit/profit pentru min și max). Este un model intern al motorului;
    pentru expunerea în API vezi notele din docstring-ul modulului calculator.
    """
    cost_breakdown: ProductionCostBreakdown
    total_cost_mdl_ha: float

    market_price_mdl_per_ton: float
    price_reference: SourceRef

    # Venit brut (MDL/ha) pentru scenariile de recoltă
    revenue_min_mdl_ha: float
    revenue_max_mdl_ha: float
    revenue_avg_mdl_ha: float

    # Profit net (MDL/ha) pentru scenariile de recoltă
    net_profit_min_mdl_ha: float
    net_profit_max_mdl_ha: float
    net_profit_avg_mdl_ha: float

    # Prag de rentabilitate: recolta minimă (t/ha) care acoperă costurile totale
    break_even_yield_t_ha: float

    # Marja netă (%) = profit net / venit brut × 100
    margin_min_pct: float
    margin_max_pct: float


def build_cost_breakdown(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry,
) -> Tuple[ProductionCostBreakdown, float]:
    """
    Construiește devizul de costuri per hectar (MDL/ha) pe cele 4 categorii,
    aplicând ajustări deterministe în funcție de sol și climă.
    Returnează: (cost_breakdown, total_cost_mdl).
    """
    # 1. Semințe & material semincer (cost fix de referință)
    seeds_cost = crop.base_seed_cost_mdl

    # 2. Îngrășăminte (NPK / azotat de amoniu)
    # Humus scăzut (< 2.5%) => necesar NPK suplimentar; humus ridicat (> 3.5%) => economie.
    humus_adjustment = 1.0
    if soil.humus_pct < 2.5:
        humus_adjustment = 1.20
    elif soil.humus_pct > 3.5:
        humus_adjustment = 0.90
    fertilizer_cost = round(crop.base_fertilizer_cost_mdl * humus_adjustment, 2)

    # 3a. Carburant (motorină) — pe terenuri erodate consumul crește cu ~15%.
    fuel_multiplier = 1.0
    if soil.erosion_grade in ["moderat", "puternic"]:
        fuel_multiplier = 1.15
    fuel_cost = round(crop.base_fuel_cost_mdl * fuel_multiplier, 2)

    # 4. Tratamente de protecție (erbicide, fungicide, insecticide)
    # Umiditate ridicată pe frunză (> 4h) => necesar suplimentar de fungicide.
    pesticide_multiplier = 1.0
    if climate.leaf_wetness_hours > 4.0:
        pesticide_multiplier = 1.25
    pesticide_cost = round(crop.base_pesticide_cost_mdl * pesticide_multiplier, 2)

    # 3b. Lucrări mecanizate & manoperă (arat, semănat, recoltat)
    mechanized_cost = crop.base_mechanized_cost_mdl

    total_cost_mdl = round(
        seeds_cost + fertilizer_cost + fuel_cost + pesticide_cost + mechanized_cost,
        2,
    )

    breakdown = ProductionCostBreakdown(
        seeds_mdl=seeds_cost,
        fertilizers_mdl=fertilizer_cost,
        fuel_diesel_mdl=fuel_cost,
        pesticides_mdl=pesticide_cost,
        mechanized_labor_mdl=mechanized_cost,
        total_cost_mdl=total_cost_mdl,
    )
    return breakdown, total_cost_mdl


def calculate_crop_finances(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry,
    yield_est: EstimatedYield,
) -> Tuple[ProductionCostBreakdown, float, float, float]:
    """
    Varianta compatibilă (contract stabil pentru calculator.py și API):
    venitul și profitul net sunt calculate pe recolta MEDIE (min + max)/2.
    Returnează: (cost_breakdown, total_cost_mdl, gross_revenue_mdl, net_profit_mdl).
    """
    breakdown, total_cost_mdl = build_cost_breakdown(crop, soil, climate)

    avg_yield = (yield_est.min_t_ha + yield_est.max_t_ha) / 2.0
    gross_revenue_mdl = round(avg_yield * crop.market_price_mdl_per_ton, 2)
    net_profit_mdl = round(gross_revenue_mdl - total_cost_mdl, 2)

    return breakdown, total_cost_mdl, gross_revenue_mdl, net_profit_mdl


def calculate_crop_financials(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry,
    yield_est: EstimatedYield,
) -> CropFinancials:
    """
    Imaginea financiară completă, inclusiv metrici care încă nu au câmp în schema API:
      * venit și profit net pentru recolta minimă, maximă și medie;
      * prag de rentabilitate (t/ha) = cost_total / preț_piață;
      * marja netă (%) = profit_net / venit_brut × 100, pentru min și max.
    """
    breakdown, total_cost_mdl = build_cost_breakdown(crop, soil, climate)
    price = crop.market_price_mdl_per_ton

    revenue_min = round(yield_est.min_t_ha * price, 2)
    revenue_max = round(yield_est.max_t_ha * price, 2)
    avg_yield = (yield_est.min_t_ha + yield_est.max_t_ha) / 2.0
    revenue_avg = round(avg_yield * price, 2)

    net_min = round(revenue_min - total_cost_mdl, 2)
    net_max = round(revenue_max - total_cost_mdl, 2)
    net_avg = round(revenue_avg - total_cost_mdl, 2)

    # Prag de rentabilitate: câte tone/ha trebuie obținute ca să se acopere costurile.
    break_even = round(total_cost_mdl / price, 2) if price > 0 else 0.0

    # Marja netă (%) — raportată la venitul brut al fiecărui scenariu.
    margin_min = round((net_min / revenue_min) * 100, 2) if revenue_min > 0 else 0.0
    margin_max = round((net_max / revenue_max) * 100, 2) if revenue_max > 0 else 0.0

    price_reference = crop.references.get(
        "market_price", SourceRef(source="necunoscut", verified=False)
    )

    return CropFinancials(
        cost_breakdown=breakdown,
        total_cost_mdl_ha=total_cost_mdl,
        market_price_mdl_per_ton=price,
        price_reference=price_reference,
        revenue_min_mdl_ha=revenue_min,
        revenue_max_mdl_ha=revenue_max,
        revenue_avg_mdl_ha=revenue_avg,
        net_profit_min_mdl_ha=net_min,
        net_profit_max_mdl_ha=net_max,
        net_profit_avg_mdl_ha=net_avg,
        break_even_yield_t_ha=break_even,
        margin_min_pct=margin_min,
        margin_max_pct=margin_max,
    )
