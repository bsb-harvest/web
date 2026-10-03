"""
Rute Mock — Unblocking din Ziua 1 pentru Frontend (Persoana 1).
Responsabilitate: Persoana 2 (Backend Core Engineer)
Task 2.2: Expunere rute API cu răspunsuri Mock garantate conform contractului comun.
"""

from fastapi import APIRouter
from fastapi import APIRouter
from app.models.schemas import ParcelAnalysisResponse, ParcelAnalyzeRequest
import json
from pathlib import Path

router = APIRouter()


@router.get("/contract", response_model=ParcelAnalysisResponse, summary="Obține mostra de date din contractul comun")
async def get_contract_sample():
    """Returnează contractul JSON standard pe care se bazează toate modulele."""
    seed_file = Path(__file__).parent.parent.parent / "data_pipeline" / "seed" / "sample_contract.json"
    if seed_file.exists():
        with open(seed_file, "r", encoding="utf-8") as f:
            return json.load(f)
    
    # Răspuns direct garantat
    return {
        "parcel_id": "parc-balti-001",
        "cadastral_code": "0300987654",
        "area_ha": 28.4,
        "coordinates": [[27.915, 47.755], [27.935, 47.755], [27.935, 47.77], [27.915, 47.77]],
        "soil_profile": {
            "type": "Cernoziom levigat și tipic lutos (Stepa Bălților)",
            "bonitate_points": 84,
            "humus_pct": 4.2,
            "ph": 6.8,
            "erosion_grade": "lipsa"
        },
        "climate_telemetry": {
            "nearest_station_id": "agro-st-balti-01",
            "distance_km": 6.1,
            "soil_moisture_pct": 46.5,
            "leaf_wetness_hours": 4.0,
            "precipitation_last_30d_mm": 36.0,
            "eto_evapotranspiration_mm": 3.8
        },
        "recommended_crops": [
            {
                "crop_name": "Grau de toamna",
                "suitability_score": 94,
                "estimated_yield": {"min_t_ha": 4.8, "max_t_ha": 6.2},
                "estimated_costs_mdl_ha": 12200.0,
                "estimated_revenue_mdl_ha": 21500.0,
                "net_profit_mdl_ha": 9300.0
            },
            {
                "crop_name": "Floarea-soarelui",
                "suitability_score": 91,
                "estimated_yield": {"min_t_ha": 2.6, "max_t_ha": 3.4},
                "estimated_costs_mdl_ha": 11800.0,
                "estimated_revenue_mdl_ha": 23800.0,
                "net_profit_mdl_ha": 12000.0
            }
        ],
        "ai_guidance": {
            "summary": "Solul are o bonitate excelentă (84p), specifică Stepei Bălților. Rapița și Grâul de toamnă oferă cel mai scăzut risc agronomic datorită bunei rezerve hidrice din sol.",
            "risks": [
                "Deficit hidric ocazional în faza de umplere a bobului",
                "Risc scăzut de fuzarioză dacă se respectă asolamentul"
            ],
            "actionable_steps": [
                "Fertilizare fracționată cu azot la reluarea vegetației în primăvară",
                "Efectuarea arăturii adânci sau a scarificării pentru spargerea hardpanului"
            ]
        }
    }


@router.post("/analyze", response_model=ParcelAnalysisResponse, summary="Simulare analiză parcelă cu răspuns mock rapid")
async def mock_analyze_parcel(request: ParcelAnalyzeRequest):
    """Permite testarea interfeței Frontend chiar înainte de finalizarea calculelor spațiale grele."""
    sample = await get_contract_sample()
    if isinstance(sample, dict):
        sample["cadastral_code"] = request.cadastral_code or sample["cadastral_code"]
        sample["coordinates"] = request.coordinates
        if request.area_ha and request.area_ha > 0:
            sample["area_ha"] = round(request.area_ha, 2)
        return sample
    return sample
