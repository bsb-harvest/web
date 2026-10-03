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
        "parcel_id": "parc-001",
        "cadastral_code": "0100123456",
        "area_ha": 15.5,
        "coordinates": [[28.83, 47.01], [28.84, 47.01], [28.84, 47.02], [28.83, 47.02]],
        "soil_profile": {
            "type": "Cernoziom tipic moderat humifer",
            "bonitate_points": 76,
            "humus_pct": 3.8,
            "ph": 7.2,
            "erosion_grade": "slab"
        },
        "climate_telemetry": {
            "nearest_station_id": "agro-st-chisinau-01",
            "distance_km": 4.2,
            "soil_moisture_pct": 42.0,
            "leaf_wetness_hours": 3.5,
            "precipitation_last_30d_mm": 28.0,
            "eto_evapotranspiration_mm": 4.5
        },
        "recommended_crops": [
            {
                "crop_name": "Floarea-soarelui",
                "suitability_score": 92,
                "estimated_yield": {"min_t_ha": 2.4, "max_t_ha": 3.2},
                "estimated_costs_mdl_ha": 11500.0,
                "estimated_revenue_mdl_ha": 22400.0,
                "net_profit_mdl_ha": 10900.0
            },
            {
                "crop_name": "Grau de toamna",
                "suitability_score": 88,
                "estimated_yield": {"min_t_ha": 4.2, "max_t_ha": 5.4},
                "estimated_costs_mdl_ha": 12000.0,
                "estimated_revenue_mdl_ha": 19000.0,
                "net_profit_mdl_ha": 7000.0
            }
        ],
        "ai_guidance": {
            "summary": "Solul are un potențial ridicat de bonitate (76p), însă rezerva de apă este moderat-limitativă.",
            "risks": [
                "Deficit hidric în faza de înflorire",
                "Risc scăzut de fuzarioză datorită umidității reduse pe frunză"
            ],
            "actionable_steps": [
                "Semănat timpuriu pentru valorificarea umidității de iarnă",
                "Aplicare îngrășăminte cu fosfor la pregătirea terenului"
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
        return sample
    return sample
