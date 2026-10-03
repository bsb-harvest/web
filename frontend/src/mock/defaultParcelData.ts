import { ParcelAnalysisResponse } from "@/lib/types";

export const DEFAULT_PARCEL_DATA: ParcelAnalysisResponse = {
  parcel_id: "parc-chisinau-001",
  cadastral_code: "0100123456",
  area_ha: 15.5,
  coordinates: [
    [28.8300, 47.0100],
    [28.8450, 47.0100],
    [28.8450, 47.0220],
    [28.8300, 47.0220]
  ],
  soil_profile: {
    type: "Cernoziom tipic moderat humifer",
    bonitate_points: 76,
    humus_pct: 3.8,
    ph: 7.2,
    erosion_grade: "slab"
  },
  climate_telemetry: {
    nearest_station_id: "agro-st-chisinau-01",
    distance_km: 4.2,
    soil_moisture_pct: 42.0,
    leaf_wetness_hours: 3.5,
    precipitation_last_30d_mm: 28.0,
    eto_evapotranspiration_mm: 4.5
  },
  recommended_crops: [
    {
      crop_name: "Floarea-soarelui",
      suitability_score: 92,
      estimated_yield: { min_t_ha: 2.4, max_t_ha: 3.2 },
      estimated_costs_mdl_ha: 11500,
      estimated_revenue_mdl_ha: 22400,
      net_profit_mdl_ha: 10900,
      cost_breakdown: {
        seeds_mdl: 2200,
        fertilizers_mdl: 3800,
        fuel_diesel_mdl: 2600,
        pesticides_mdl: 1700,
        mechanized_labor_mdl: 1200,
        total_cost_mdl: 11500
      }
    },
    {
      crop_name: "Grau de toamna",
      suitability_score: 88,
      estimated_yield: { min_t_ha: 4.2, max_t_ha: 5.4 },
      estimated_costs_mdl_ha: 12000,
      estimated_revenue_mdl_ha: 19000,
      net_profit_mdl_ha: 7000,
      cost_breakdown: {
        seeds_mdl: 1800,
        fertilizers_mdl: 4200,
        fuel_diesel_mdl: 2800,
        pesticides_mdl: 1900,
        mechanized_labor_mdl: 1300,
        total_cost_mdl: 12000
      }
    },
    {
      crop_name: "Rapita",
      suitability_score: 84,
      estimated_yield: { min_t_ha: 2.6, max_t_ha: 3.5 },
      estimated_costs_mdl_ha: 12300,
      estimated_revenue_mdl_ha: 28000,
      net_profit_mdl_ha: 15700,
      cost_breakdown: {
        seeds_mdl: 2400,
        fertilizers_mdl: 4500,
        fuel_diesel_mdl: 2900,
        pesticides_mdl: 2200,
        mechanized_labor_mdl: 1300,
        total_cost_mdl: 12300
      }
    },
    {
      crop_name: "Porumb",
      suitability_score: 74,
      estimated_yield: { min_t_ha: 5.1, max_t_ha: 6.8 },
      estimated_costs_mdl_ha: 13800,
      estimated_revenue_mdl_ha: 20200,
      net_profit_mdl_ha: 6400,
      cost_breakdown: {
        seeds_mdl: 2600,
        fertilizers_mdl: 4800,
        fuel_diesel_mdl: 3200,
        pesticides_mdl: 1800,
        mechanized_labor_mdl: 1400,
        total_cost_mdl: 13800
      }
    }
  ],
  ai_guidance: {
    summary: "Solul din parcela selectată prezintă o notă de bonitate excelentă (76p). Cultura de Floarea-soarelui oferă cel mai scăzut risc climatic, în timp ce Rapița are potențialul financiar maxim dacă rezerva de apă este protejată.",
    risks: [
      "Deficit hidric moderat în stratul 20-40 cm; risc la culturile sensibile precum Porumbul.",
      "Risc scăzut de fuzarioză și mană datorită duratei reduse a umidității pe frunză (3.5 ore)."
    ],
    actionable_steps: [
      "Semănat timpurie în prima fereastră optimă de temperatură (sol >8°C).",
      "Aplicarea îngrășămintelor fosfatice în rând odată cu semănatul.",
      "Efectuarea unei treceri cu tăvălugul după semănat pentru a favoriza urcarea capilară a apei."
    ]
  }
};
