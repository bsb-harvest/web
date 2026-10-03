"""
Baza de date agronomică pentru culturile principale din Republica Moldova.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.1: Fișe tehnologice pentru 6 culturi reprezentative.
"""

from typing import Dict
from pydantic import BaseModel, Field


class CropProfile(BaseModel):
    name: str
    latin_name: str
    optimal_ph_min: float
    optimal_ph_max: float
    min_humus_pct: float
    drought_tolerance: str  # ridicata, medie, sensibila
    kc_water_coefficient: float  # Factor de evapotranspiratie
    base_bonitate_yield_ratio: float  # t/ha per punct de bonitate in conditii optime
    market_price_mdl_per_ton: float  # Pret mediu piata locala Moldova (MDL/tona)
    
    # Costuri standard de referinta per hectar (MDL/ha)
    base_seed_cost_mdl: float
    base_fertilizer_cost_mdl: float
    base_fuel_cost_mdl: float
    base_pesticide_cost_mdl: float
    base_mechanized_cost_mdl: float


# Catalogul celor 6 culturi cheie din Moldova
CROPS_DATABASE: Dict[str, CropProfile] = {
    "Floarea-soarelui": CropProfile(
        name="Floarea-soarelui",
        latin_name="Helianthus annuus",
        optimal_ph_min=6.5,
        optimal_ph_max=7.5,
        min_humus_pct=2.5,
        drought_tolerance="ridicata",
        kc_water_coefficient=0.85,
        base_bonitate_yield_ratio=0.038,  # ex: la bonitate 75 -> ~2.85 t/ha
        market_price_mdl_per_ton=7800.0,
        base_seed_cost_mdl=2200.0,
        base_fertilizer_cost_mdl=3800.0,
        base_fuel_cost_mdl=2600.0,
        base_pesticide_cost_mdl=1700.0,
        base_mechanized_cost_mdl=1200.0
    ),
    "Grau de toamna": CropProfile(
        name="Grau de toamna",
        latin_name="Triticum aestivum",
        optimal_ph_min=6.0,
        optimal_ph_max=7.8,
        min_humus_pct=2.2,
        drought_tolerance="medie",
        kc_water_coefficient=0.90,
        base_bonitate_yield_ratio=0.065,  # la bonitate 75 -> ~4.8 t/ha
        market_price_mdl_per_ton=3800.0,
        base_seed_cost_mdl=1800.0,
        base_fertilizer_cost_mdl=4200.0,
        base_fuel_cost_mdl=2800.0,
        base_pesticide_cost_mdl=1900.0,
        base_mechanized_cost_mdl=1300.0
    ),
    "Porumb": CropProfile(
        name="Porumb",
        latin_name="Zea mays",
        optimal_ph_min=6.2,
        optimal_ph_max=7.5,
        min_humus_pct=3.0,
        drought_tolerance="sensibila",
        kc_water_coefficient=1.15,
        base_bonitate_yield_ratio=0.095,  # la bonitate 75 -> ~7.1 t/ha
        market_price_mdl_per_ton=3400.0,
        base_seed_cost_mdl=2600.0,
        base_fertilizer_cost_mdl=4800.0,
        base_fuel_cost_mdl=3200.0,
        base_pesticide_cost_mdl=1800.0,
        base_mechanized_cost_mdl=1400.0
    ),
    "Rapita": CropProfile(
        name="Rapita",
        latin_name="Brassica napus",
        optimal_ph_min=6.0,
        optimal_ph_max=7.2,
        min_humus_pct=2.8,
        drought_tolerance="medie",
        kc_water_coefficient=0.95,
        base_bonitate_yield_ratio=0.042,  # la bonitate 75 -> ~3.1 t/ha
        market_price_mdl_per_ton=9200.0,
        base_seed_cost_mdl=2400.0,
        base_fertilizer_cost_mdl=4500.0,
        base_fuel_cost_mdl=2900.0,
        base_pesticide_cost_mdl=2200.0,
        base_mechanized_cost_mdl=1300.0
    ),
    "Soia": CropProfile(
        name="Soia",
        latin_name="Glycine max",
        optimal_ph_min=6.5,
        optimal_ph_max=7.5,
        min_humus_pct=3.0,
        drought_tolerance="sensibila",
        kc_water_coefficient=1.05,
        base_bonitate_yield_ratio=0.035,  # la bonitate 75 -> ~2.6 t/ha
        market_price_mdl_per_ton=8900.0,
        base_seed_cost_mdl=2100.0,
        base_fertilizer_cost_mdl=2800.0,  # Fixează azot atmosferic
        base_fuel_cost_mdl=2500.0,
        base_pesticide_cost_mdl=1900.0,
        base_mechanized_cost_mdl=1200.0
    ),
    "Orz de toamna": CropProfile(
        name="Orz de toamna",
        latin_name="Hordeum vulgare",
        optimal_ph_min=6.2,
        optimal_ph_max=8.0,
        min_humus_pct=2.0,
        drought_tolerance="ridicata",
        kc_water_coefficient=0.80,
        base_bonitate_yield_ratio=0.060,  # la bonitate 75 -> ~4.5 t/ha
        market_price_mdl_per_ton=3500.0,
        base_seed_cost_mdl=1600.0,
        base_fertilizer_cost_mdl=3600.0,
        base_fuel_cost_mdl=2600.0,
        base_pesticide_cost_mdl=1600.0,
        base_mechanized_cost_mdl=1100.0
    ),
}
