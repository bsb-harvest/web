"""
Pachetul Agronomic Engine — Calcule deterministe de randament și costuri.
Persoana 4: Agronomic & Financial Logic Engineer
"""

from app.agronomic_engine.calculator import calculate_crop_economics
from app.agronomic_engine.crops_database import CROPS_DATABASE, CropProfile
from app.agronomic_engine.suitability import calculate_suitability_score
from app.agronomic_engine.yield_calculator import calculate_crop_yield
from app.agronomic_engine.financial_engine import calculate_crop_finances

__all__ = [
    "calculate_crop_economics",
    "CROPS_DATABASE",
    "CropProfile",
    "calculate_suitability_score",
    "calculate_crop_yield",
    "calculate_crop_finances",
]
