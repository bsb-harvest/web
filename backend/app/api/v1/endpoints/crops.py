"""
Rute pentru catalogul culturilor agricole.
"""

from typing import List, Dict
from fastapi import APIRouter
from app.agronomic_engine.crops_database import CROPS_DATABASE, CropProfile

router = APIRouter()


@router.get("/", response_model=Dict[str, CropProfile], summary="Catalogul celor 6 culturi reprezentative din Moldova")
async def get_all_crops():
    """Returnează fișele tehnologice și parametrii economici standard."""
    return CROPS_DATABASE
