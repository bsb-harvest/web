"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Search, Sparkles } from "lucide-react";

interface ParcelMapProps {
  coordinates: number[][];
  areaHa: number;
  cadastralCode?: string | null;
  soilBonitate?: number;
  soilType?: string;
  onPolygonChange: (coords: number[][]) => void;
  onAnalyze: (cadastralCode?: string) => void;
  isAnalyzing: boolean;
}

const PRESET_PARCELS = [
  {
    name: "Chișinău (Centru)",
    code: "0100123456",
    coords: [
      [28.8300, 47.0100],
      [28.8450, 47.0100],
      [28.8450, 47.0220],
      [28.8300, 47.0220]
    ]
  },
  {
    name: "Bălți (Nord - Cernoziom)",
    code: "0300987654",
    coords: [
      [27.9150, 47.7550],
      [27.9350, 47.7550],
      [27.9350, 47.7700],
      [27.9150, 47.7700]
    ]
  },
  {
    name: "Cahul (Sud - Zonă Aridă)",
    code: "1700456123",
    coords: [
      [28.1800, 45.8950],
      [28.2000, 45.8950],
      [28.2000, 45.9120],
      [28.1800, 45.9120]
    ]
  },
  {
    name: "Orhei (Codru)",
    code: "6400789456",
    coords: [
      [28.8100, 47.3750],
      [28.8300, 47.3750],
      [28.8300, 47.3900],
      [28.8100, 47.3900]
    ]
  }
];

export const ParcelMap: React.FC<ParcelMapProps> = ({
  coordinates,
  areaHa,
  cadastralCode,
  soilBonitate = 0,
  soilType,
  onPolygonChange,
  onAnalyze,
  isAnalyzing,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const [inputCode, setInputCode] = useState(cadastralCode || "0100123456");
  const [activeLayer, setActiveLayer] = useState<"satellite" | "streets">("satellite");
  const [currentCoords, setCurrentCoords] = useState<number[][]>(coordinates);

  // Inițializare hartă Leaflet pe client
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted) return;

      // Fix pentru iconițele implicite Leaflet în bundler
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const centerLat = coordinates[0]?.[1] || 47.0105;
        const centerLng = coordinates[0]?.[0] || 28.8350;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 14,
          zoomControl: true,
        });

        // Layer Satelit ESRI
        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 18,
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          }
        ).addTo(map);

        // Layer Cartografic OpenStreetMap
        const streetsLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        });

        (map as any)._layersMap = {
          satellite: satelliteLayer,
          streets: streetsLayer,
        };

        const polygon = L.polygon([], {
          color: "#22c55e",
          weight: 3,
          fillColor: "#4ade80",
          fillOpacity: 0.35,
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        polygonLayerRef.current = polygon;
        markersGroupRef.current = markersGroup;
      }

      updatePolygonDisplay(L, currentCoords);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizare poligon pe hartă
  const updatePolygonDisplay = (L: any, coords: number[][]) => {
    if (!mapInstanceRef.current || !polygonLayerRef.current) return;

    const latLngs = coords.map((pt) => [pt[1], pt[0]]);
    polygonLayerRef.current.setLatLngs(latLngs);

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
      latLngs.forEach((latLng, idx) => {
        const marker = L.circleMarker(latLng, {
          radius: 6,
          fillColor: "#ffffff",
          color: "#15803d",
          weight: 2,
          fillOpacity: 1,
        });
        markersGroupRef.current.addLayer(marker);
      });
    }

    if (latLngs.length > 0) {
      mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds(), {
        padding: [30, 30],
        maxZoom: 15,
      });
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PARCELS[0]) => {
    setInputCode(preset.code);
    setCurrentCoords(preset.coords);
    onPolygonChange(preset.coords);

    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        updatePolygonDisplay(L, preset.coords);
      });
    }
  };

  const toggleLayer = (layer: "satellite" | "streets") => {
    if (!mapInstanceRef.current || !(mapInstanceRef.current as any)._layersMap) return;
    const map = mapInstanceRef.current;
    const layers = (map as any)._layersMap;

    if (layer === "satellite") {
      map.removeLayer(layers.streets);
      map.addLayer(layers.satellite);
    } else {
      map.removeLayer(layers.satellite);
      map.addLayer(layers.streets);
    }
    setActiveLayer(layer);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.55)]">
      {/* Top Map Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        {/* Preset Selector */}
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Modele:
          </span>
          {PRESET_PARCELS.map((p) => (
            <button
              key={p.code}
              onClick={() => handleSelectPreset(p)}
              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Layer Toggle */}
        <div className="hidden shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold sm:flex">
          <button
            onClick={() => toggleLayer("satellite")}
              className={`rounded-lg px-2.5 py-1.5 transition-all ${
              activeLayer === "satellite"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Satelit
          </button>
          <button
            onClick={() => toggleLayer("streets")}
              className={`rounded-lg px-2.5 py-1.5 transition-all ${
              activeLayer === "streets"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hartă
          </button>
        </div>
      </div>

      {/* Cadastral Search & Analyze Action Bar */}
      <div className="absolute left-4 right-4 top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur">
        <div className="flex min-w-[220px] max-w-xl flex-1 items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Număr cadastral (ex: 0100123456)..."
              className="w-full rounded-xl border-0 bg-transparent py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suprafață</div>
            <div className="text-sm font-extrabold text-slate-900">{areaHa.toFixed(2)} ha</div>
          </div>

          <button
            onClick={() => onAnalyze(inputCode)}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-xl bg-agri-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-agri-700 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isAnalyzing ? "Se analizează..." : "Analizează parcela"}</span>
            <span className="sm:hidden">Analizează</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative h-[430px] w-full bg-slate-100 sm:h-[540px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Overlay Info */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-xl shadow-slate-900/10 backdrop-blur">
          <MapPin className="h-4 w-4 shrink-0 text-agri-600" />
          <span>Poligon activ: <strong>{currentCoords.length} puncte GPS</strong></span>
        </div>

        <div className="absolute bottom-4 right-4 z-20 hidden w-64 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-slate-900/15 backdrop-blur md:block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Parcelă selectată</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" />
          </div>
          <div className="mt-3 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Parcela activă</p>
              <p className="truncate text-xs text-slate-500">#{cadastralCode || inputCode}</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">{areaHa.toFixed(2)} <span className="text-sm font-bold text-slate-400">ha</span></p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="truncate text-slate-500">{soilType || "Profil pedologic"}</span>
            <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{soilBonitate}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
