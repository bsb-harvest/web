import { ParcelAnalysisResponse } from "@/lib/types";

export const DEFAULT_PARCEL_DATA: ParcelAnalysisResponse = {
  parcel_id: "parc-md-default",
  cadastral_code: null,
  area_ha: 0,
  coordinates: [],
  soil_profile: {
    type: "Cernoziom tipic și levigat (Republica Moldova)",
    bonitate_points: 82,
    humus_pct: 3.8,
    ph: 6.8,
    erosion_grade: "lipsa"
  },
  climate_telemetry: {
    nearest_station_id: "agro-st-md-01",
    distance_km: 5.2,
    soil_moisture_pct: 45.0,
    leaf_wetness_hours: 4.0,
    precipitation_last_30d_mm: 35.0,
    eto_evapotranspiration_mm: 3.6
  },
  recommended_crops: [
    {
      crop_name: "Rapita",
      suitability_score: 95,
      estimated_yield: { min_t_ha: 2.8, max_t_ha: 3.8 },
      market_price_mdl_per_ton: 9200,
      estimated_costs_mdl_ha: 12600,
      estimated_revenue_mdl_ha: 30360,
      net_profit_mdl_ha: 17760,
      break_even_yield_t_ha: 1.37,
      net_profit_min_mdl_ha: 13160,
      net_profit_max_mdl_ha: 22360,
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
      crop_name: "Floarea-soarelui",
      suitability_score: 91,
      estimated_yield: { min_t_ha: 2.6, max_t_ha: 3.4 },
      market_price_mdl_per_ton: 7800,
      estimated_costs_mdl_ha: 11800,
      estimated_revenue_mdl_ha: 23400,
      net_profit_mdl_ha: 11600,
      break_even_yield_t_ha: 1.51,
      net_profit_min_mdl_ha: 8480,
      net_profit_max_mdl_ha: 14720,
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
      crop_name: "Grau de toamna",
      suitability_score: 89,
      estimated_yield: { min_t_ha: 4.8, max_t_ha: 6.2 },
      market_price_mdl_per_ton: 3800,
      estimated_costs_mdl_ha: 12200,
      estimated_revenue_mdl_ha: 20900,
      net_profit_mdl_ha: 8700,
      break_even_yield_t_ha: 3.21,
      net_profit_min_mdl_ha: 6040,
      net_profit_max_mdl_ha: 11360,
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
      crop_name: "Porumb",
      suitability_score: 82,
      estimated_yield: { min_t_ha: 6.2, max_t_ha: 8.1 },
      market_price_mdl_per_ton: 3400,
      estimated_costs_mdl_ha: 14200,
      estimated_revenue_mdl_ha: 24310,
      net_profit_mdl_ha: 10110,
      break_even_yield_t_ha: 4.18,
      net_profit_min_mdl_ha: 6880,
      net_profit_max_mdl_ha: 13340,
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
    summary: "Selectează o parcelă pe hartă sau introdu un număr cadastral pentru a obține o analiză pedologică și climatică personalizată. Datele demonstrative afișate prezintă valorile medii de referință pentru Republica Moldova.",
    risks: [
      "Deficit hidric periodic în lunile iulie-august pe teritoriul Republicii Moldova.",
      "Variații locale de fertilitate și relief în funcție de panta terenului."
    ],
    actionable_steps: [
      "Identifică conturul exact al parcelei tale pe harta interactivă.",
      "Consultă bonitatea specifică a solului și rezerva de apă din zona ta.",
      "Solicită asistentului Dr. Agro recomandări detaliate de rotație și fertilizare."
    ]
  }
};
