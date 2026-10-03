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

export const PRELOADED_PARCELS: PreloadedParcel[] = [
  {
    cadastral_code: "0300987654",
    name: "Câmpul de Elită Bălți (Răuțel)",
    region: "Nord (Bălți)",
    area_ha: 28.4,
    landuse: "Teren agricol pentru culturi cerealiere și tehnice",
    coordinates: [
      [27.9150, 47.7550],
      [27.9350, 47.7550],
      [27.9350, 47.7700],
      [27.9150, 47.7700],
    ],
    soil_profile: {
      type: "Cernoziom levigat și tipic lutos",
      bonitate_points: 84,
      humus_pct: 4.2,
      ph: 6.8,
      erosion_grade: "lipsa",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-balti-01",
      distance_km: 6.1,
      soil_moisture_pct: 46.5,
      leaf_wetness_hours: 4.0,
      precipitation_last_30d_mm: 36.0,
      eto_evapotranspiration_mm: 3.8,
    },
  },
  {
    cadastral_code: "1700456123",
    name: "Plantația Cahul Sud (Roșu)",
    region: "Sud (Cahul)",
    area_ha: 42.0,
    landuse: "Teren arabil și plantații viticole",
    coordinates: [
      [28.1800, 45.8950],
      [28.2000, 45.8950],
      [28.2000, 45.9120],
      [28.1800, 45.9120],
    ],
    soil_profile: {
      type: "Cernoziom carbonatic și xerofitic de stepă",
      bonitate_points: 68,
      humus_pct: 3.1,
      ph: 7.8,
      erosion_grade: "moderat",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-cahul-01",
      distance_km: 5.4,
      soil_moisture_pct: 34.0,
      leaf_wetness_hours: 2.1,
      precipitation_last_30d_mm: 19.5,
      eto_evapotranspiration_mm: 5.2,
    },
  },
  {
    cadastral_code: "6400789456",
    name: "Livada și Câmpul Orhei Codru",
    region: "Centru (Orhei)",
    area_ha: 18.2,
    landuse: "Plantație pomicolă și arabil",
    coordinates: [
      [28.8100, 47.3750],
      [28.8300, 47.3750],
      [28.8300, 47.3900],
      [28.8100, 47.3900],
    ],
    soil_profile: {
      type: "Sol cenușiu de pădure",
      bonitate_points: 72,
      humus_pct: 3.2,
      ph: 6.4,
      erosion_grade: "slab",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-orhei-01",
      distance_km: 7.8,
      soil_moisture_pct: 40.0,
      leaf_wetness_hours: 4.8,
      precipitation_last_30d_mm: 31.0,
      eto_evapotranspiration_mm: 4.1,
    },
  },
  {
    cadastral_code: "94162160609",
    name: "Parcela Cadastrală Crihana Veche (Luncă)",
    region: "Sud (Lunca Prutului)",
    area_ha: 11.81,
    landuse: "Teren pentru obținerea producției agricole",
    coordinates: [
      [28.2942, 45.7258],
      [28.2940, 45.7264],
      [28.2931, 45.7270],
      [28.2927, 45.7273],
      [28.2925, 45.7273],
      [28.2916, 45.7272],
      [28.2911, 45.7272],
      [28.2909, 45.7272],
      [28.2914, 45.7256],
      [28.2907, 45.7271],
      [28.2897, 45.7271],
      [28.2888, 45.7270],
      [28.2893, 45.7254],
      [28.2898, 45.7237],
      [28.2911, 45.7239],
      [28.2927, 45.7240],
      [28.2942, 45.7258],
    ],
    soil_profile: {
      type: "Soluri cernoziomuri carbonatice și soluri aluviale",
      bonitate_points: 74,
      humus_pct: 3.4,
      ph: 7.6,
      erosion_grade: "slab",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-cahul-01",
      distance_km: 8.2,
      soil_moisture_pct: 38.0,
      leaf_wetness_hours: 3.0,
      precipitation_last_30d_mm: 22.0,
      eto_evapotranspiration_mm: 4.9,
    },
  },
  {
    cadastral_code: "92012050123",
    name: "Teren Agricol Valea Prutului (Ungheni)",
    region: "Vest (Ungheni)",
    area_ha: 22.5,
    landuse: "Teren arabil irigabil",
    coordinates: [
      [27.7900, 47.2000],
      [27.8100, 47.2000],
      [27.8100, 47.2150],
      [27.7900, 47.2150],
    ],
    soil_profile: {
      type: "Soluri cernoziomuri tipice și levigate",
      bonitate_points: 80,
      humus_pct: 3.9,
      ph: 6.9,
      erosion_grade: "slab",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-balti-01",
      distance_km: 24.0,
      soil_moisture_pct: 44.0,
      leaf_wetness_hours: 3.8,
      precipitation_last_30d_mm: 30.0,
      eto_evapotranspiration_mm: 4.2,
    },
  },
  {
    cadastral_code: "41011020345",
    name: "Agro-Sector Fălești (Călugăr)",
    region: "Silvostepă (Fălești)",
    area_ha: 34.0,
    landuse: "Teren arabil pentru cereale și floarea-soarelui",
    coordinates: [
      [27.7000, 47.5700],
      [27.7250, 47.5700],
      [27.7250, 47.5880],
      [27.7000, 47.5880],
    ],
    soil_profile: {
      type: "Cernoziom cambic profund",
      bonitate_points: 82,
      humus_pct: 4.1,
      ph: 6.9,
      erosion_grade: "lipsa",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-balti-01",
      distance_km: 18.5,
      soil_moisture_pct: 45.0,
      leaf_wetness_hours: 4.2,
      precipitation_last_30d_mm: 34.0,
      eto_evapotranspiration_mm: 3.9,
    },
  },
  {
    cadastral_code: "78013040567",
    name: "Teren Cernoziom Nistrean (Soroca)",
    region: "Nord-Est (Soroca)",
    area_ha: 26.3,
    landuse: "Teren arabil și livezi de măr",
    coordinates: [
      [28.2800, 48.1500],
      [28.3050, 48.1500],
      [28.3050, 48.1680],
      [28.2800, 48.1680],
    ],
    soil_profile: {
      type: "Cernoziomuri tipice",
      bonitate_points: 85,
      humus_pct: 4.3,
      ph: 7.0,
      erosion_grade: "lipsa",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-balti-01",
      distance_km: 35.0,
      soil_moisture_pct: 43.0,
      leaf_wetness_hours: 4.5,
      precipitation_last_30d_mm: 33.0,
      eto_evapotranspiration_mm: 3.7,
    },
  },
  {
    cadastral_code: "85014050678",
    name: "Podgoria Purcari (Ștefan Vodă)",
    region: "Sud-Est (Ștefan Vodă)",
    area_ha: 31.7,
    landuse: "Plantație viticolă și culturi de toamnă",
    coordinates: [
      [29.8500, 46.5200],
      [29.8750, 46.5200],
      [29.8750, 46.5380],
      [29.8500, 46.5380],
    ],
    soil_profile: {
      type: "Soluri cernoziomuri tipice slab humifere",
      bonitate_points: 75,
      humus_pct: 3.3,
      ph: 7.3,
      erosion_grade: "slab",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-chisinau-01",
      distance_km: 65.0,
      soil_moisture_pct: 37.0,
      leaf_wetness_hours: 3.1,
      precipitation_last_30d_mm: 24.0,
      eto_evapotranspiration_mm: 4.7,
    },
  },
  {
    cadastral_code: "96017080901",
    name: "Câmpul Deschis Comrat (Bugeac)",
    region: "Sud (Găgăuzia)",
    area_ha: 45.0,
    landuse: "Cereale de stepă și floarea-soarelui",
    coordinates: [
      [28.6400, 46.2800],
      [28.6700, 46.2800],
      [28.6700, 46.3000],
      [28.6400, 46.3000],
    ],
    soil_profile: {
      type: "Soluri carbonatice și tipice slab humifere",
      bonitate_points: 66,
      humus_pct: 2.9,
      ph: 7.9,
      erosion_grade: "moderat",
    },
    climate_telemetry: {
      nearest_station_id: "agro-st-cahul-01",
      distance_km: 42.0,
      soil_moisture_pct: 32.0,
      leaf_wetness_hours: 2.0,
      precipitation_last_30d_mm: 18.0,
      eto_evapotranspiration_mm: 5.4,
    },
  },
];

// Zonele pedologice oficiale ale Republicii Moldova (soluri.gov.md / IPM „Nicolae Dimo”)
// Pre-încărcate vectorial pentru randare instantanee pe Canvas (0ms latență, fără cereri de rețea externe)
export interface SoilZoneVector {
  id: string;
  name: string;
  subregion: string;
  color: string;
  coordinates: number[][]; // Poligon WGS84
}

export const MOLDOVA_SOIL_ZONES: SoilZoneVector[] = [
  {
    id: "zone-1",
    name: "Soluri cenușii și cernoziomuri levigate",
    subregion: "Podișul Central al Codrilor (Orhei, Strășeni, Călărași)",
    color: "#abd0a7",
    coordinates: [
      [28.25, 47.45],
      [28.85, 47.48],
      [29.05, 47.25],
      [28.85, 46.95],
      [28.40, 47.05],
      [28.25, 47.45],
    ],
  },
  {
    id: "zone-2",
    name: "Soluri cernoziomuri tipice și levigate",
    subregion: "Zona de Vest (Fălești, Ungheni, Nisporeni)",
    color: "#ce9da7",
    coordinates: [
      [27.65, 47.55],
      [28.25, 47.45],
      [28.40, 47.05],
      [28.05, 46.90],
      [27.70, 47.15],
      [27.65, 47.55],
    ],
  },
  {
    id: "zone-3",
    name: "Cernoziomuri tipice",
    subregion: "Stepa Bălților (Bălți, Soroca, Florești)",
    color: "#bcb7cd",
    coordinates: [
      [27.60, 47.95],
      [28.35, 48.25],
      [28.60, 48.05],
      [28.35, 47.60],
      [27.70, 47.55],
      [27.60, 47.95],
    ],
  },
  {
    id: "zone-4",
    name: "Soluri cenușii, cernoziomuri argiloiluviale",
    subregion: "Nordul Extrem (Briceni, Ocnița, Dondușeni)",
    color: "#d8c1b3",
    coordinates: [
      [26.85, 48.40],
      [27.80, 48.50],
      [27.85, 48.15],
      [27.20, 48.10],
      [26.85, 48.40],
    ],
  },
  {
    id: "zone-5",
    name: "Soluri cernoziomuri tipice și carbonatice",
    subregion: "Câmpia Nistrului (Rîșcani, Drochia, Șoldănești)",
    color: "#dfdec0",
    coordinates: [
      [27.35, 48.00],
      [27.95, 48.10],
      [28.85, 47.85],
      [28.35, 47.60],
      [27.50, 47.75],
      [27.35, 48.00],
    ],
  },
  {
    id: "zone-6",
    name: "Soluri cernoziomuri tipice slab humifere",
    subregion: "Sud-Est (Căușeni, Ștefan Vodă, Anenii Noi)",
    color: "#d9c2da",
    coordinates: [
      [29.05, 47.05],
      [29.95, 46.65],
      [29.80, 46.35],
      [29.10, 46.50],
      [28.85, 46.85],
      [29.05, 47.05],
    ],
  },
  {
    id: "zone-7",
    name: "Soluri cernoziomuri carbonatice și soluri aluviale",
    subregion: "Lunca Prutului de Jos (Cantemir, Leova, Cahul)",
    color: "#d4e6c8",
    coordinates: [
      [28.05, 46.65],
      [28.45, 46.50],
      [28.35, 45.65],
      [28.15, 45.75],
      [28.05, 46.65],
    ],
  },
  {
    id: "zone-8",
    name: "Soluri carbonatice și tipice slab humifere",
    subregion: "Stepa Bugeacului (Comrat, Taraclia, Ceadîr-Lunga)",
    color: "#c9edee",
    coordinates: [
      [28.45, 46.50],
      [28.95, 46.40],
      [28.80, 45.70],
      [28.35, 45.70],
      [28.45, 46.50],
    ],
  },
];

// Helper pentru găsirea celei mai apropiate parcele pre-încărcate sau verificarea intersecției
export function findPreloadedParcel(lat: number, lng: number): PreloadedParcel | null {
  // 1. Verificăm mai întâi dacă punctul este în interiorul vreunui poligon
  for (const p of PRELOADED_PARCELS) {
    if (isPointInPolygon([lng, lat], p.coordinates)) {
      return p;
    }
  }

  // 2. Verificăm proximitatea (dacă a dat click aproape de o parcelă, ex. la max ~1-2km)
  let closestParcel: PreloadedParcel | null = null;
  let minDistance = 0.025; // aprox 2.5 km

  for (const p of PRELOADED_PARCELS) {
    const centerLng = p.coordinates.reduce((sum, c) => sum + c[0], 0) / p.coordinates.length;
    const centerLat = p.coordinates.reduce((sum, c) => sum + c[1], 0) / p.coordinates.length;
    const dist = Math.sqrt(Math.pow(lng - centerLng, 2) + Math.pow(lat - centerLat, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestParcel = p;
    }
  }

  return closestParcel;
}

function isPointInPolygon(point: number[], polygon: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
