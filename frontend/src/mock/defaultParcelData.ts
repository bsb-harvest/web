import { ParcelAnalysisResponse } from "@/lib/types";

export const DEFAULT_PARCEL_DATA: ParcelAnalysisResponse = {
  parcel_id: "parc-balti-001",
  cadastral_code: "0300987654",
  area_ha: 28.4,
  coordinates: [
    [27.9150, 47.7550],
    [27.9350, 47.7550],
    [27.9350, 47.7700],
    [27.9150, 47.7700]
  ],
  soil_profile: {
    type: "Cernoziom levigat și tipic lutos (Stepa Bălților)",
    bonitate_points: 84,
    humus_pct: 4.2,
    ph: 6.8,
    erosion_grade: "lipsa"
  },
  climate_telemetry: {
    nearest_station_id: "agro-st-balti-01",
    distance_km: 6.1,
    soil_moisture_pct: 46.5,
    leaf_wetness_hours: 4.0,
    precipitation_last_30d_mm: 36.0,
    eto_evapotranspiration_mm: 3.8
  },
  recommended_crops: [
    {
      crop_name: "Grau de toamna",
      suitability_score: 94,
      estimated_yield: { min_t_ha: 4.8, max_t_ha: 6.2 },
      estimated_costs_mdl_ha: 12200,
      estimated_revenue_mdl_ha: 21500,
      net_profit_mdl_ha: 9300,
      cost_breakdown: {
        seeds_mdl: 1900,
        fertilizers_mdl: 4400,
        fuel_diesel_mdl: 2700,
        pesticides_mdl: 1900,
        mechanized_labor_mdl: 1300,
        total_cost_mdl: 12200
      }
    },
    {
      crop_name: "Floarea-soarelui",
      suitability_score: 91,
      estimated_yield: { min_t_ha: 2.6, max_t_ha: 3.4 },
      estimated_costs_mdl_ha: 11800,
      estimated_revenue_mdl_ha: 23800,
      net_profit_mdl_ha: 12000,
      cost_breakdown: {
        seeds_mdl: 2300,
        fertilizers_mdl: 3900,
        fuel_diesel_mdl: 2600,
        pesticides_mdl: 1800,
        mechanized_labor_mdl: 1200,
        total_cost_mdl: 11800
      }
    },
    {
      crop_name: "Rapita",
      suitability_score: 87,
      estimated_yield: { min_t_ha: 2.8, max_t_ha: 3.8 },
      estimated_costs_mdl_ha: 12600,
      estimated_revenue_mdl_ha: 29500,
      net_profit_mdl_ha: 16900,
      cost_breakdown: {
        seeds_mdl: 2500,
        fertilizers_mdl: 4600,
        fuel_diesel_mdl: 2900,
        pesticides_mdl: 2300,
        mechanized_labor_mdl: 1300,
        total_cost_mdl: 12600
      }
    },
    {
      crop_name: "Porumb",
      suitability_score: 82,
      estimated_yield: { min_t_ha: 6.2, max_t_ha: 8.1 },
      estimated_costs_mdl_ha: 14200,
      estimated_revenue_mdl_ha: 22600,
      net_profit_mdl_ha: 8400,
      cost_breakdown: {
        seeds_mdl: 2700,
        fertilizers_mdl: 5000,
        fuel_diesel_mdl: 3200,
        pesticides_mdl: 1900,
        mechanized_labor_mdl: 1400,
        total_cost_mdl: 14200
      }
    }
  ],
  ai_guidance: {
    summary: "Solul din parcela selectată (Cernoziom levigat și tipic lutos din Stepa Bălților) prezintă o notă de bonitate excelentă (84p), fiind una dintre cele mai fertile zone agricole din Republica Moldova. Rapița oferă profitul net maxim, iar Grâul de toamnă are cel mai scăzut risc agronomic datorită bunei rezerve de umiditate din sol (46.5%).",
    risks: [
      "Deficit hidric ocazional în faza de umplere a bobului la cereale în verile secetoase.",
      "Risc scăzut spre moderat de fuzarioză dacă survin ploi abundente în faza de înflorire."
    ],
    actionable_steps: [
      "Fertilizare fracționată cu azot la reluarea vegetației în primăvară (faza de înfrățire și alungire a paiului).",
      "Efectuarea unei treceri cu grapa sau tăvălugul pentru ruperea crustei și limitarea evapotranspirației.",
      "Monitorizarea apariției dăunătorilor specifici (gândacul ghebos, ploșnița cerealelor) înainte de faza de burduf."
    ]
  }
};
