"""
Pachetul Agronomic Engine — Calcule deterministe de randament și costuri.
Persoana 4: Agronomic & Financial Logic Engineer
"""

from app.agronomic_engine.calculator import calculate_crop_economics
from app.agronomic_engine.crops_database import CROPS_DATABASE, CropProfile, SourceRef
from app.agronomic_engine.suitability import calculate_suitability_score
from app.agronomic_engine.yield_calculator import calculate_crop_yield, relative_water_deficit
from app.agronomic_engine.financial_engine import (
    calculate_crop_finances,
    calculate_crop_financials,
    build_cost_breakdown,
    CropFinancials,
)

__all__ = [
    "calculate_crop_economics",
    "CROPS_DATABASE",
    "CropProfile",
    "SourceRef",
    "calculate_suitability_score",
    "calculate_crop_yield",
    "relative_water_deficit",
    "calculate_crop_finances",
    "calculate_crop_financials",
    "build_cost_breakdown",
    "CropFinancials",
]
