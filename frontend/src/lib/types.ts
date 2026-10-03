/**
 * Contractul comun de date (TypeScript Types) pentru AgriTech AI Guidance Moldova.
 * Respectă schema docs/API_CONTRACT.json și modelele Pydantic din backend.
 */

export interface SoilProfile {
  type: string;
  bonitate_points: number;
  humus_pct: number;
  ph: number;
  erosion_grade: "lipsa" | "slab" | "moderat" | "puternic" | string;
}

export interface ClimateTelemetry {
  nearest_station_id: string;
  distance_km: number;
  soil_moisture_pct: number;
  leaf_wetness_hours: number;
  precipitation_last_30d_mm: number;
  eto_evapotranspiration_mm: number;
}

export interface EstimatedYield {
  min_t_ha: number;
  max_t_ha: number;
}

export interface ProductionCostBreakdown {
  seeds_mdl?: number;
  fertilizers_mdl?: number;
  fuel_diesel_mdl?: number;
  pesticides_mdl?: number;
  mechanized_labor_mdl?: number;
  total_cost_mdl?: number;
}

export interface RecommendedCrop {
  crop_name: string;
  suitability_score: number;
  estimated_yield: EstimatedYield;
  estimated_costs_mdl_ha: number;
  estimated_revenue_mdl_ha: number;
  net_profit_mdl_ha: number;
  cost_breakdown?: ProductionCostBreakdown;
}

export interface AIGuidance {
  summary: string;
  risks: string[];
  actionable_steps: string[];
}

export interface ParcelAnalysisResponse {
  parcel_id: string;
  cadastral_code?: string | null;
  area_ha: number;
  coordinates: number[][];
  soil_profile: SoilProfile;
  climate_telemetry: ClimateTelemetry;
  recommended_crops: RecommendedCrop[];
  ai_guidance: AIGuidance;
}

export interface ParcelAnalyzeRequest {
  cadastral_code?: string;
  coordinates: number[][];
  user_id?: string;
  parcel_name?: string;
}

export interface ChatAttachment {
  name: string;
  content_type: string;
  data_base64: string;
  preview_url?: string;
  size_kb?: number;
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}

export interface ChatMessageRequest {
  parcel_id: string;
  message: string;
  context?: Record<string, unknown>;
  attachments?: ChatAttachment[];
}

export interface ChatMessageResponse {
  reply: string;
  suggested_questions?: string[];
}
