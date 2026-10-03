"""
Baza de date agronomică pentru culturile principale din Republica Moldova.
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.1: Fișe tehnologice pentru 6 culturi reprezentative.

Surse pentru parametrii agro-ecologici:
  * kc_mid  -> FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998),
               Tabelul 12 (coeficient de cultură mijloc de sezon, Kc mid).
  * ky      -> FAO Irrigation and Drainage Paper No. 33 (Doorenbos & Kassam, 1979),
               factor de răspuns al producției la deficitul de apă (sezonier).
  * pH optim, texturi, toleranță la secetă -> fișe tehnologice pentru condițiile
               pedoclimatice ale Republicii Moldova.
"""

from typing import Dict, List
from pydantic import BaseModel, Field


class CropProfile(BaseModel):
    name: str
    latin_name: str

    # Interval de pH optim și abaterea tolerată (Task 4.1)
    ph_optimal_min: float = Field(..., description="Limita inferioară a intervalului de pH optim")
    ph_optimal_max: float = Field(..., description="Limita superioară a intervalului de pH optim")
    ph_tolerance: float = Field(
        0.5,
        description="Abaterea (unități pH) tolerată peste intervalul optim înainte de penalizare severă",
    )

    min_humus_pct: float
    drought_tolerance: str  # Task 4.1: "scazuta" / "medie" / "ridicata"
    kc_water_coefficient: float  # Factor istoric de evapotranspirație (păstrat pentru compatibilitate)
    base_bonitate_yield_ratio: float  # t/ha per punct de bonitate in conditii optime
    market_price_mdl_per_ton: float  # Pret mediu piata locala Moldova (MDL/tona)

    # Costuri standard de referinta per hectar (MDL/ha)
    base_seed_cost_mdl: float
    base_fertilizer_cost_mdl: float
    base_fuel_cost_mdl: float
    base_pesticide_cost_mdl: float
    base_mechanized_cost_mdl: float

    # Parametri agro-ecologici extinși (Task 4.1)
    suitable_textures: List[str] = Field(
        ...,
        description="Texturi de sol pretabile (lutos, luto-argilos, argilos, luto-nisipos, nisipos)",
    )
    kc_mid: float = Field(..., description="Coeficient de cultură mijloc de sezon, Kc mid (FAO-56, Tab. 12)")
    ky: float = Field(..., description="Factor de răspuns al producției la deficit hidric, Ky (FAO-33)")


# Catalogul celor 6 culturi cheie din Moldova
CROPS_DATABASE: Dict[str, CropProfile] = {
    "Floarea-soarelui": CropProfile(
        name="Floarea-soarelui",
        latin_name="Helianthus annuus",
        ph_optimal_min=6.5,
        ph_optimal_max=7.5,
        ph_tolerance=0.6,
        min_humus_pct=2.5,
        drought_tolerance="ridicata",
        kc_water_coefficient=0.85,
        base_bonitate_yield_ratio=0.038,  # ex: la bonitate 75 -> ~2.85 t/ha
        market_price_mdl_per_ton=7800.0,
        base_seed_cost_mdl=2200.0,
        base_fertilizer_cost_mdl=3800.0,
        base_fuel_cost_mdl=2600.0,
        base_pesticide_cost_mdl=1700.0,
        base_mechanized_cost_mdl=1200.0,
        suitable_textures=["lutos", "luto-argilos", "luto-nisipos", "argilos"],
        kc_mid=1.05,  # FAO-56 Tab.12: floarea-soarelui 1.00-1.15
        ky=0.95,      # FAO-33: sezonier ~0.95
    ),
    "Grau de toamna": CropProfile(
        name="Grau de toamna",
        latin_name="Triticum aestivum",
        ph_optimal_min=6.0,
        ph_optimal_max=7.8,
        ph_tolerance=0.5,
        min_humus_pct=2.2,
        drought_tolerance="medie",
        kc_water_coefficient=0.90,
        base_bonitate_yield_ratio=0.065,  # la bonitate 75 -> ~4.8 t/ha
        market_price_mdl_per_ton=3800.0,
        base_seed_cost_mdl=1800.0,
        base_fertilizer_cost_mdl=4200.0,
        base_fuel_cost_mdl=2800.0,
        base_pesticide_cost_mdl=1900.0,
        base_mechanized_cost_mdl=1300.0,
        suitable_textures=["lutos", "luto-argilos", "argilos"],
        kc_mid=1.15,  # FAO-56 Tab.12: grâu (winter wheat) 1.15
        ky=1.00,      # FAO-33: grâu de toamnă ~1.0
    ),
    "Porumb": CropProfile(
        name="Porumb",
        latin_name="Zea mays",
        ph_optimal_min=6.2,
        ph_optimal_max=7.5,
        ph_tolerance=0.4,
        min_humus_pct=3.0,
        drought_tolerance="scazuta",
        kc_water_coefficient=1.15,
        base_bonitate_yield_ratio=0.095,  # la bonitate 75 -> ~7.1 t/ha
        market_price_mdl_per_ton=3400.0,
        base_seed_cost_mdl=2600.0,
        base_fertilizer_cost_mdl=4800.0,
        base_fuel_cost_mdl=3200.0,
        base_pesticide_cost_mdl=1800.0,
        base_mechanized_cost_mdl=1400.0,
        suitable_textures=["lutos", "luto-argilos", "luto-nisipos"],
        kc_mid=1.20,  # FAO-56 Tab.12: porumb boabe 1.20
        ky=1.25,      # FAO-33: porumb sezonier 1.25 (sensibil la secetă)
    ),
    "Rapita": CropProfile(
        name="Rapita",
        latin_name="Brassica napus",
        ph_optimal_min=6.0,
        ph_optimal_max=7.2,
        ph_tolerance=0.5,
        min_humus_pct=2.8,
        drought_tolerance="medie",
        kc_water_coefficient=0.95,
        base_bonitate_yield_ratio=0.042,  # la bonitate 75 -> ~3.1 t/ha
        market_price_mdl_per_ton=9200.0,
        base_seed_cost_mdl=2400.0,
        base_fertilizer_cost_mdl=4500.0,
        base_fuel_cost_mdl=2900.0,
        base_pesticide_cost_mdl=2200.0,
        base_mechanized_cost_mdl=1300.0,
        suitable_textures=["lutos", "luto-argilos", "argilos"],
        kc_mid=1.10,  # FAO-56 Tab.12: rapiță/canola 1.00-1.15
        ky=0.90,      # FAO-33: fără valoare canonică; estimare fișe tehnologice MD
    ),
    "Soia": CropProfile(
        name="Soia",
        latin_name="Glycine max",
        ph_optimal_min=6.5,
        ph_optimal_max=7.5,
        ph_tolerance=0.4,
        min_humus_pct=3.0,
        drought_tolerance="scazuta",
        kc_water_coefficient=1.05,
        base_bonitate_yield_ratio=0.035,  # la bonitate 75 -> ~2.6 t/ha
        market_price_mdl_per_ton=8900.0,
        base_seed_cost_mdl=2100.0,
        base_fertilizer_cost_mdl=2800.0,  # Fixează azot atmosferic
        base_fuel_cost_mdl=2500.0,
        base_pesticide_cost_mdl=1900.0,
        base_mechanized_cost_mdl=1200.0,
        suitable_textures=["lutos", "luto-argilos", "luto-nisipos"],
        kc_mid=1.15,  # FAO-56 Tab.12: soia 1.15
        ky=0.85,      # FAO-33: soia sezonier 0.85
    ),
    "Orz de toamna": CropProfile(
        name="Orz de toamna",
        latin_name="Hordeum vulgare",
        ph_optimal_min=6.2,
        ph_optimal_max=8.0,
        ph_tolerance=0.6,
        min_humus_pct=2.0,
        drought_tolerance="ridicata",
        kc_water_coefficient=0.80,
        base_bonitate_yield_ratio=0.060,  # la bonitate 75 -> ~4.5 t/ha
        market_price_mdl_per_ton=3500.0,
        base_seed_cost_mdl=1600.0,
        base_fertilizer_cost_mdl=3600.0,
        base_fuel_cost_mdl=2600.0,
        base_pesticide_cost_mdl=1600.0,
        base_mechanized_cost_mdl=1100.0,
        suitable_textures=["lutos", "luto-argilos", "luto-nisipos", "argilos"],
        kc_mid=1.15,  # FAO-56 Tab.12: orz 1.15
        ky=1.00,      # FAO-33: orz ~1.0
    ),
}
