"""
Contractul comun de date (JSON Schemas) pentru AgriTech AI Guidance Moldova.
Interfață unică între Frontend (P1), Backend (P2), Data Pipeline (P3),
Agronomic Engine (P4) și AI Service (P5).
"""

from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel, Field


class CoordinatesPoint(BaseModel):
    lng: float
    lat: float


class SoilProfile(BaseModel):
    type: str = Field(..., description="Tipul și subtipul de sol (ex: Cernoziom tipic moderat humifer)")
    bonitate_points: int = Field(..., ge=1, le=100, description="Nota de bonitate a solului (1-100 puncte)")
    humus_pct: float = Field(..., ge=0.0, le=20.0, description="Conținutul de humus în procente (%)")
    ph: float = Field(..., ge=3.0, le=10.0, description="Nivelul pH al solului")
    erosion_grade: Literal["lipsa", "slab", "moderat", "puternic"] = Field(
        "slab", description="Gradul de eroziune a parcelei"
    )


class ClimateTelemetry(BaseModel):
    nearest_station_id: str = Field(..., description="Identificatorul stației agrometeorologice")
    distance_km: float = Field(..., description="Distanța până la stație în km")
    soil_moisture_pct: float = Field(..., description="Umiditatea solului în procente (%)")
    leaf_wetness_hours: float = Field(..., description="Ore de umiditate pe frunze (ultimele 24h)")
    precipitation_last_30d_mm: float = Field(..., description="Precipitații cumulate în ultimele 30 zile (mm)")
    eto_evapotranspiration_mm: float = Field(..., description="Evapotranspirația de referință ETo (mm/zi)")
    is_interpolated: bool = Field(default=False, description="Indică dacă telemetria a fost interpolată spațial prin IDW din cauza stației celei mai apropiate offline")


class EstimatedYield(BaseModel):
    min_t_ha: float = Field(..., description="Producție minimă prognozată (tone/hectar)")
    max_t_ha: float = Field(..., description="Producție maximă prognozată (tone/hectar)")


class ProductionCostBreakdown(BaseModel):
    seeds_mdl: float = Field(default=0.0, description="Cost semințe (MDL/ha)")
    fertilizers_mdl: float = Field(default=0.0, description="Cost îngrășăminte NPK (MDL/ha)")
    fuel_diesel_mdl: float = Field(default=0.0, description="Cost motorină și carburanți (MDL/ha)")
    pesticides_mdl: float = Field(default=0.0, description="Cost tratamente fitosanitare (MDL/ha)")
    mechanized_labor_mdl: float = Field(default=0.0, description="Cost lucrări mecanizate/forță de muncă (MDL/ha)")
    total_cost_mdl: float = Field(..., description="Cost total per hectar (MDL/ha)")


class RecommendedCrop(BaseModel):
    crop_name: str = Field(..., description="Numele culturii agricole (ex: Floarea-soarelui, Grâu, Porumb)")
    suitability_score: int = Field(..., ge=0, le=100, description="Scor de pretabilitate ecologică (0-100%)")
    estimated_yield: EstimatedYield = Field(..., description="Randament estimat în t/ha")
    estimated_costs_mdl_ha: float = Field(..., description="Cost total de producție (MDL/ha)")
    estimated_revenue_mdl_ha: float = Field(..., description="Venit brut estimat (MDL/ha)")
    net_profit_mdl_ha: float = Field(..., description="Profit net estimat (MDL/ha)")
    cost_breakdown: Optional[ProductionCostBreakdown] = Field(None, description="Detalierea costurilor")
    break_even_yield_t_ha: Optional[float] = Field(None, description="Prag de rentabilitate: recolta (t/ha) care acoperă costurile totale")
    net_profit_min_mdl_ha: Optional[float] = Field(None, description="Profit net pe scenariul de recoltă minimă (MDL/ha)")
    net_profit_max_mdl_ha: Optional[float] = Field(None, description="Profit net pe scenariul de recoltă maximă (MDL/ha)")
    margin_min_pct: Optional[float] = Field(None, description="Marja netă (%) pe scenariul de recoltă minimă")
    margin_max_pct: Optional[float] = Field(None, description="Marja netă (%) pe scenariul de recoltă maximă")


class AIGuidance(BaseModel):
    summary: str = Field(..., description="Sinteza agronomică generată de Google Gemini")
    risks: List[str] = Field(..., description="Riscuri identificate (secetă, fuzarioză, pH, etc.)")
    actionable_steps: List[str] = Field(..., description="Măsuri agrotehnice recomandate fermierului")


class ParcelAnalysisResponse(BaseModel):
    parcel_id: str = Field(..., description="Identificator unic parcelă")
    cadastral_code: Optional[str] = Field(None, description="Cod cadastral dacă este disponibil")
    area_ha: float = Field(..., gt=0, description="Suprafața parcelei în hectare")
    coordinates: List[List[float]] = Field(..., description="Poligonul parcelei [[lng, lat], ...]")
    soil_profile: SoilProfile
    climate_telemetry: ClimateTelemetry
    recommended_crops: List[RecommendedCrop]
    ai_guidance: AIGuidance
    warnings: List[str] = Field(
        default_factory=list,
        description=(
            "Avertismente privind calitatea datelor: stație meteo îndepărtată, "
            "acoperire pedologică parțială, telemetrie veche sau valori estimate. "
            "Câmp opțional — lista goală înseamnă date complete."
        ),
    )


class ParcelAnalyzeRequest(BaseModel):
    cadastral_code: Optional[str] = Field(None, description="Codul cadastral opțional")
    coordinates: List[List[float]] = Field(
        ...,
        description="Coordonatele poligonului parcelei sub forma [[lng, lat], ...]",
        min_length=3
    )
    user_id: Optional[str] = Field(None, description="ID fermier / utilizator")
    parcel_name: Optional[str] = Field("Parcela mea", description="Denumirea parcelei")


class ChatAttachment(BaseModel):
    name: str = Field(..., description="Numele fișierului încărcat")
    content_type: str = Field(..., description="MIME type (ex: image/jpeg, image/png, application/pdf)")
    data_base64: str = Field(..., description="Conținutul fișierului codificat în Base64")


class ChatMessageRequest(BaseModel):
    parcel_id: str
    message: str
    context: Optional[dict] = None
    attachments: Optional[List[ChatAttachment]] = Field(default=None, description="Imagini sau documente atașate (ex: buletin de analiză sol, foto boli)")


class ChatMessageResponse(BaseModel):
    reply: str
    suggested_questions: List[str] = []
