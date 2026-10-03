export interface PreloadedParcel {
  cadastral_code: string;
  name: string;
  region: string;
  area_ha: number;
  landuse: string;
  coordinates: number[][]; // [lng, lat]
  soil_profile: {
    type: string;
    bonitate_points: number;
    humus_pct: number;
    ph: number;
    erosion_grade: "lipsa" | "slab" | "moderat" | "puternic";
  };
  climate_telemetry: {
    nearest_station_id: string;
    distance_km: number;
    soil_moisture_pct: number;
    leaf_wetness_hours: number;
    precipitation_last_30d_mm: number;
    eto_evapotranspiration_mm: number;
  };
}

// Toate zonele și parcelele predefinite au fost eliminate conform cerinței
export const PRELOADED_PARCELS: PreloadedParcel[] = [];

export interface SoilZoneVector {
  id: string;
  name: string;
  subregion: string;
  color: string;
  coordinates: number[][];
}

export const MOLDOVA_SOIL_ZONES: SoilZoneVector[] = [];

export function findPreloadedParcel(_lat: number, _lng: number): PreloadedParcel | null {
  return null;
}
