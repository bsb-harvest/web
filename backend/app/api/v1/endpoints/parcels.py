"""
Endpoint Principal de Analiză Parcelă Agricolă.
Responsabilitate: Persoana 2 (Backend Core Engineer)
Task 2.5: Integrarea modulelor GIS (P3), Agronomic Engine (P4) și AI Service (P5).
"""

import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ParcelAnalyzeRequest, ParcelAnalysisResponse
from app.data_pipeline.spatial_matcher import match_parcel_environment
from app.agronomic_engine.calculator import calculate_crop_economics
from app.ai_service.gemini_client import ai_service

router = APIRouter()


@router.post("/analyze", response_model=ParcelAnalysisResponse, summary="Analiză completă parcelă (GIS + Bonitate + Finanțe + AI)")
async def analyze_parcel(request: ParcelAnalyzeRequest):
    """
    Endpointul cheie al platformei:
    1. Calculează aria (ha) și intersecția spațială cu profilul de sol (soluri.gov.md)
       și cea mai apropiată stație meteo (agrodat.md).
    2. Rulează motorul agronomic determinist (P4) pentru a calcula recolta (t/ha),
       devizul de costuri (MDL/ha) și profitul net pentru 6 culturi.
    3. Trimite datele către stratul AI Google Gemini (P5) pentru sinteză,
       analiza riscurilor fitosanitare și măsuri agrotehnice.
    """
    try:
        # 1. Extragere mediu pedoclimatic (P3)
        soil, climate, calculated_area_ha = match_parcel_environment(request.coordinates)

        # 2. Calcule agronomice și financiare deterministe (P4)
        recommended_crops = calculate_crop_economics(soil=soil, climate=climate)

        # 3. Sinteză cognitivă Google Gemini AI (P5)
        ai_guidance = ai_service.generate_guidance(
            soil=soil,
            climate=climate,
            crops=recommended_crops,
            area_ha=calculated_area_ha
        )

        parcel_id = f"parc-{uuid.uuid4().hex[:8]}"

        return ParcelAnalysisResponse(
            parcel_id=parcel_id,
            cadastral_code=request.cadastral_code,
            area_ha=calculated_area_ha,
            coordinates=request.coordinates,
            soil_profile=soil,
            climate_telemetry=climate,
            recommended_crops=recommended_crops,
            ai_guidance=ai_guidance
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la procesarea parcelei: {str(e)}")
