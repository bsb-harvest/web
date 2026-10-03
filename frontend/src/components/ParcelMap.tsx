"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Search, Layers, RotateCcw, Check, Sparkles } from "lucide-react";

interface ParcelMapProps {
  coordinates: number[][];
  areaHa: number;
  cadastralCode?: string | null;
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Map Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mostre Moldova:
          </span>
          {PRESET_PARCELS.map((p) => (
            <button
              key={p.code}
              onClick={() => handleSelectPreset(p)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-agri-500 hover:text-agri-700 transition-colors whitespace-nowrap shadow-xs"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Layer Toggle */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => toggleLayer("satellite")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeLayer === "satellite"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Satelit
          </button>
          <button
            onClick={() => toggleLayer("streets")}
            className={`px-2.5 py-1 rounded-md transition-all ${
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
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Număr cadastral (ex: 0100123456)..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agri-500/20 focus:border-agri-500 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Suprafață Parcelă:</div>
            <div className="text-sm font-bold text-slate-900">{areaHa.toFixed(2)} ha</div>
          </div>

          <button
            onClick={() => onAnalyze(inputCode)}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-agri-600 hover:bg-agri-700 disabled:opacity-50 shadow-sm transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Se analizează..." : "Analizează Sol & Recoltă"}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Overlay Info */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200/80 shadow-md text-xs text-slate-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-agri-600 shrink-0" />
          <span>Poligon activ: <strong>{currentCoords.length} puncte GPS</strong> înregistrate</span>
        </div>
      </div>
    </div>
  );
};
