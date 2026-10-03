"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  Sparkles,
  Layers,
  MapPin,
  Edit3,
  Check,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ParcelMapProps {
  coordinates: number[][]; // [[lng, lat], ...]
  areaHa: number;
  cadastralCode?: string | null;
  soilBonitate?: number;
  soilType?: string;
  onPolygonChange: (coords: number[][]) => void;
  onAnalyze: (cadastralCode?: string, overrideCoords?: number[][], officialAreaHa?: number) => void;
  isAnalyzing: boolean;
}

// Calcul determinist al ariei poligonului în hectare (proiecție sferică WGS84)
function calculatePolygonAreaHa(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi =
      (coords[i][0] * Math.PI * 6378137 * Math.cos((coords[i][1] * Math.PI) / 180)) / 180;
    const yi = (coords[i][1] * Math.PI * 6378137) / 180;
    const xj =
      (coords[j][0] * Math.PI * 6378137 * Math.cos((coords[j][1] * Math.PI) / 180)) / 180;
    const yj = (coords[j][1] * Math.PI * 6378137) / 180;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2) / 10000;
}

export const ParcelMap: React.FC<ParcelMapProps> = ({
  coordinates,
  areaHa,
  cadastralCode,
  soilBonitate = 84,
  soilType = "Cernoziom levigat și tipic lutos",
  onPolygonChange,
  onAnalyze,
  isAnalyzing,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const drawLayerRef = useRef<any>(null);
  const soilLayerRef = useRef<any>(null);
  const tileLayersRef = useRef<{ [key: string]: any }>({});
  const leafletRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<number[][]>(coordinates || []);
  const [calculatedArea, setCalculatedArea] = useState<number>(
    coordinates && coordinates.length >= 3
      ? (areaHa && areaHa > 0 ? areaHa : calculatePolygonAreaHa(coordinates))
      : 0
  );
  const [inputCode, setInputCode] = useState<string>(cadastralCode || "");
  const [activeLayer, setActiveLayer] = useState<"satellite" | "streets">("satellite");
  const [showSoils, setShowSoils] = useState<boolean>(true);

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawPoints, setDrawPoints] = useState<number[][]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const isDrawingRef = useRef(false);
  isDrawingRef.current = isDrawing;

  const drawPointsRef = useRef<number[][]>([]);
  drawPointsRef.current = drawPoints;

  const isInternalUpdateRef = useRef<boolean>(false);

  // Actualizare poligon pe hartă cu noduri de ajustare pe colțuri
  const renderPolygon = useCallback(
    (L: any, coords: number[][], fitBounds: boolean = false) => {
      if (!polygonRef.current) return;

      if (!coords || coords.length < 3) {
        polygonRef.current.setLatLngs([]);
        if (markersGroupRef.current) {
          markersGroupRef.current.clearLayers();
        }
        return;
      }

      const clean = coords.filter((pt, i) => {
        if (i === 0) return true;
        const prev = coords[i - 1];
        return Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 0.00002;
      });

      const latLngs = clean.map((pt) => [pt[1], pt[0]]);
      polygonRef.current.setLatLngs(latLngs as any);

      if (markersGroupRef.current) {
        markersGroupRef.current.clearLayers();

        if (latLngs.length <= 30) {
          const cornerIcon = L.divIcon({
            className: "corner-handle",
            html: `<div style="
              width: 14px;
              height: 14px;
              background: #ffffff;
              border: 3px solid #16a34a;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.45);
              cursor: grab;
              transform: translate(-7px, -7px);
            "></div>`,
            iconSize: [0, 0],
          });

          const working = [...latLngs];

          latLngs.forEach((latLng, idx) => {
            const marker = L.marker(latLng as any, {
              draggable: true,
              icon: cornerIcon,
              title: `Colț #${idx + 1} (Trage pentru a ajusta)`,
            });

            marker.on("drag", (e: any) => {
              const pos = e.target.getLatLng();
              working[idx] = [pos.lat, pos.lng];
              polygonRef.current.setLatLngs(working as any);
            });

            marker.on("dragend", () => {
              const newCoords = working.map((pt: any) => [
                Number(pt[1].toFixed(5)),
                Number(pt[0].toFixed(5)),
              ]);
              setCurrentCoords(newCoords);
              const newArea = calculatePolygonAreaHa(newCoords);
              setCalculatedArea(newArea);
              onPolygonChange(newCoords);
              renderPolygon(L, newCoords, false);
            });

            markersGroupRef.current.addLayer(marker);
          });
        }
      }

      if (fitBounds && mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.fitBounds(polygonRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
      }
    },
    [onPolygonChange]
  );

  // Click / tap pe hartă pentru identificare parcelă
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (isDrawingRef.current) return;

      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      setIsSearching(true);
      setStatusMessage({
        type: "warning",
        text: `Identificare parcelă cadastrală la [${lat.toFixed(4)}, ${lng.toFixed(4)}]...`,
      });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(`/api/cadastre?lat=${lat}&lng=${lng}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const parcel = data?.parcel || data;

          if (data?.success && parcel?.coordinates && parcel.coordinates.length >= 3) {
            const areaToUse =
              parcel.area_ha && parcel.area_ha > 0
                ? parcel.area_ha
                : calculatePolygonAreaHa(parcel.coordinates);

            isInternalUpdateRef.current = true;
            setInputCode(parcel.cadastral_code);
            setCurrentCoords(parcel.coordinates);
            setCalculatedArea(areaToUse);
            onPolygonChange(parcel.coordinates);
            renderPolygon(L, parcel.coordinates, false);
            if (map.getZoom() < 13 && polygonRef.current) {
              map.fitBounds(polygonRef.current.getBounds(), {
                padding: [50, 50],
                maxZoom: 16,
                animate: true,
              });
            }
            onAnalyze(parcel.cadastral_code, parcel.coordinates, areaToUse);
            setStatusMessage({
              type: "success",
              text: `Parcelă selectată (${parcel.landuse || "Cadastru"}): Cod ${parcel.cadastral_code} • ${areaToUse} ha`,
            });
            return;
          }
        }

        setStatusMessage({
          type: "warning",
          text: `Nu s-au putut extrage date oficiale la [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Puteți introduce un cod sau desena liber.`,
        });
      } catch (err) {
        console.warn("Eroare la identificarea parcelei:", err);
        setStatusMessage({
          type: "error",
          text: "Eroare de comunicare la interogarea serverului cadastral.",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [onPolygonChange, onAnalyze, renderPolygon]
  );

  const handleMapClickRef = useRef(handleMapClick);
  handleMapClickRef.current = handleMapClick;

  // Căutare după număr cadastral
  const handleSearchCode = async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim();
    if (!cleanCode) return;

    setIsSearching(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/cadastre?code=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await res.json();
        const parcel = data?.parcel || data;

        if (data?.success && parcel?.coordinates && parcel.coordinates.length >= 3) {
          const areaToUse =
            parcel.area_ha && parcel.area_ha > 0
              ? parcel.area_ha
              : calculatePolygonAreaHa(parcel.coordinates);

          isInternalUpdateRef.current = true;
          setInputCode(parcel.cadastral_code);
          setCurrentCoords(parcel.coordinates);
          setCalculatedArea(areaToUse);
          onPolygonChange(parcel.coordinates);
          if (leafletRef.current) {
            renderPolygon(leafletRef.current, parcel.coordinates, true);
          }
          onAnalyze(parcel.cadastral_code, parcel.coordinates, areaToUse);
          setStatusMessage({
            type: "success",
            text: `Număr cadastral ${cleanCode} identificat (${areaToUse} ha).`,
          });
          return;
        }
      }
      setStatusMessage({
        type: "warning",
        text: `Numărul cadastral ${cleanCode} nu a fost găsit în serverul oficial geodata.gov.md.`,
      });
    } catch {
      setStatusMessage({
        type: "error",
        text: `Eroare de conectare la serviciul cadastral pentru codul ${cleanCode}.`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Inițializare hartă Leaflet
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;
      leafletRef.current = L;

      // Fix iconițe Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const hasCoords = coordinates && coordinates.length >= 3;
      const centerLat = hasCoords ? coordinates[0][1] : 47.15;
      const centerLng = hasCoords ? coordinates[0][0] : 28.55;
      const initialZoom = hasCoords ? 14 : 8;

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: initialZoom,
        zoomControl: true,
        ...({ tap: false } as any),
      });

      // Creare Pane-uri ierarhice
      map.createPane("soilPane");
      (map.getPane("soilPane") as HTMLElement).style.zIndex = "350";
      (map.getPane("soilPane") as HTMLElement).style.pointerEvents = "none";

      map.createPane("activeParcelPane");
      (map.getPane("activeParcelPane") as HTMLElement).style.zIndex = "500";

      // 1. Layer Satelit ESRI World Imagery
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "&copy; Esri World Imagery",
        }
      ).addTo(map);

      // 2. Layer Cartografic OpenStreetMap
      const streetsLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      });

      tileLayersRef.current = {
        satellite: satelliteLayer,
        streets: streetsLayer,
      };

      // 3. Strat Harta Solurilor Moldovei (soluri.gov.md / geodata.gov.md)
      const soilWms = (L.tileLayer as any).wms(
        "https://geodata.gov.md/geoserver/wms",
        {
          layers: "atlase:Moldova_Region_Pedogeog_reproiectat",
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          maxZoom: 18,
          opacity: 0.65,
          pane: "soilPane",
          attribution: "&copy; soluri.gov.md — Institutul „Nicolae Dimo”",
        }
      );

      if (showSoils) {
        soilWms.addTo(map);
      }
      soilLayerRef.current = soilWms;

      // 4. Poligon activ selectat (verde)
      const polygon = L.polygon([], {
        color: "#16a34a",
        weight: 3.5,
        fillColor: "#4ade80",
        fillOpacity: 0.35,
        pane: "activeParcelPane",
      }).addTo(map);

      // Tap pe poligonul activ -> re-identificare
      polygon.on("click", (e: any) => {
        L.DomEvent.stopPropagation(e);
        if (!isDrawingRef.current) {
          handleMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      const markersGroup = L.layerGroup([], { pane: "activeParcelPane" } as any).addTo(map);
      const drawLayer = L.layerGroup([], { pane: "activeParcelPane" } as any).addTo(map);

      polygonRef.current = polygon;
      markersGroupRef.current = markersGroup;
      drawLayerRef.current = drawLayer;
      mapRef.current = map;

      // Randare poligon inițial doar dacă există coordonate valide
      if (coordinates && coordinates.length >= 3) {
        renderPolygon(L, coordinates, true);
      }

      // Event listener pentru click / tap pe suprafața liberă a hărții
      map.on("click", (e: any) => {
        if (isDrawingRef.current) {
          const lat = Number(e.latlng.lat.toFixed(5));
          const lng = Number(e.latlng.lng.toFixed(5));
          const updated = [...drawPointsRef.current, [lng, lat]];
          setDrawPoints(updated);

          const dot = L.circleMarker([lat, lng], {
            radius: 5,
            color: "#eab308",
            fillColor: "#fde047",
            fillOpacity: 1,
            weight: 2,
          });
          drawLayerRef.current.addLayer(dot);

          if (updated.length >= 2) {
            const polylinePoints = updated.map((pt) => [pt[1], pt[0]]);
            drawLayerRef.current.eachLayer((layer: any) => {
              if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                drawLayerRef.current.removeLayer(layer);
              }
            });
            L.polyline(polylinePoints as any, {
              color: "#eab308",
              dashArray: "6, 6",
              weight: 2.5,
            }).addTo(drawLayerRef.current);
          }
        } else {
          handleMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      // Asigurăm redimensionarea corectă a containerului Leaflet
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sincronizare coordonate din afară
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (coordinates && coordinates.length >= 3) {
      setCurrentCoords(coordinates);
      if (areaHa && areaHa > 0) {
        setCalculatedArea(areaHa);
      }
      if (cadastralCode) {
        setInputCode(cadastralCode);
      }
      if (leafletRef.current && polygonRef.current) {
        renderPolygon(leafletRef.current, coordinates, false);
      }
    } else if (!coordinates || coordinates.length === 0) {
      setCurrentCoords([]);
      setCalculatedArea(0);
      setInputCode(cadastralCode || "");
      if (leafletRef.current && polygonRef.current) {
        renderPolygon(leafletRef.current, [], false);
      }
    }
  }, [coordinates, areaHa, cadastralCode, renderPolygon]);

  // Schimbare strat de bază (Satelit / Străzi)
  const toggleLayer = (layer: "satellite" | "streets") => {
    const map = mapRef.current;
    if (!map || !tileLayersRef.current) return;

    if (activeLayer === layer) return;

    if (tileLayersRef.current[activeLayer]) {
      map.removeLayer(tileLayersRef.current[activeLayer]);
    }
    if (tileLayersRef.current[layer]) {
      tileLayersRef.current[layer].addTo(map);
    }
    setActiveLayer(layer);
  };

  // Toggle strat soluri WMS
  const toggleSoilWms = () => {
    const map = mapRef.current;
    const soilLayer = soilLayerRef.current;
    if (!map || !soilLayer) return;

    if (showSoils) {
      map.removeLayer(soilLayer);
      setShowSoils(false);
    } else {
      soilLayer.addTo(map);
      setShowSoils(true);
    }
  };

  // Mod desenare manuală
  const startDrawing = () => {
    setIsDrawing(true);
    setDrawPoints([]);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    setStatusMessage({
      type: "warning",
      text: "Mod Desenare Activ: Faceți clic pe hartă pentru a plasa nodurile parcelei.",
    });
  };

  const finishDrawing = () => {
    if (drawPoints.length < 3) {
      setStatusMessage({
        type: "error",
        text: "Sunt necesare cel puțin 3 puncte pentru a închide un contur.",
      });
      return;
    }
    const L = leafletRef.current;
    const closed = [...drawPoints, drawPoints[0]];
    const newArea = calculatePolygonAreaHa(closed);

    isInternalUpdateRef.current = true;
    setCurrentCoords(closed);
    setCalculatedArea(newArea);
    onPolygonChange(closed);
    if (L) {
      renderPolygon(L, closed, true);
    }
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    setIsDrawing(false);
    setDrawPoints([]);
    onAnalyze(inputCode, closed, newArea);
    setStatusMessage({
      type: "success",
      text: `Contur salvat: ${newArea.toFixed(2)} ha (${closed.length - 1} puncte).`,
    });
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    setStatusMessage(null);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.55)]">
      {/* Top Map Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
          <span className="text-xs font-bold text-slate-800">
            Harta Cadastrală Interactivă
          </span>
          <span className="hidden text-[11px] text-slate-400 sm:inline">
            • Atingeți sau faceți clic oriunde pe hartă pentru a selecta o parcelă
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
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
            Străzi
          </button>
          <button
            onClick={toggleSoilWms}
            title="Activează/Dezactivează straturile oficiale de sol soluri.gov.md"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
              showSoils
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Soluri WMS</span>
          </button>
        </div>
      </div>

      {/* Cadastral Search & Action Bar (Floating pill) */}
      <div className="absolute left-4 right-4 top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur">
        <div className="flex min-w-[220px] max-w-xl flex-1 items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchCode(inputCode)}
              placeholder="Introduceți numărul cadastral (ex: 0300987654)..."
              className="w-full rounded-xl border-0 bg-transparent py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={() => handleSearchCode(inputCode)}
            disabled={isSearching}
            className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Caută"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suprafață
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {calculatedArea > 0 ? `${calculatedArea.toFixed(2)} ha` : "-- ha"}
            </div>
          </div>

          {!isDrawing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={startDrawing}
                title="Desenează liber un contur de parcelă pe hartă"
                className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex sm:items-center sm:gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Desenează</span>
              </button>
              <button
                onClick={() => onAnalyze(inputCode, currentCoords, calculatedArea)}
                disabled={isAnalyzing || currentCoords.length < 3}
                title={currentCoords.length < 3 ? "Selectează mai întâi o parcelă pe hartă" : "Analizează parcela"}
                className="flex items-center gap-2 rounded-xl bg-agri-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-agri-700 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:text-sm"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">
                  {isAnalyzing ? "Se analizează..." : "Analizează parcela"}
                </span>
                <span className="sm:hidden">Analizează</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={finishDrawing}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finalizează ({drawPoints.length})</span>
              </button>
              <button
                onClick={cancelDrawing}
                className="flex items-center gap-1 rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                <X className="w-3.5 h-3.5" />
                <span>Anulează</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`absolute left-4 right-4 top-32 z-20 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold shadow-md backdrop-blur ${
            statusMessage.type === "success"
              ? "border border-emerald-300/80 bg-emerald-50/95 text-emerald-900"
              : statusMessage.type === "warning"
              ? "border border-amber-300/80 bg-amber-50/95 text-amber-900"
              : "border border-rose-300/80 bg-rose-50/95 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === "warning" && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
            {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative h-[430px] w-full bg-slate-100 sm:h-[540px]">
        <div ref={containerRef} className="w-full h-full z-10" />

        {/* Floating Map Overlay Info (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-xl shadow-slate-900/10 backdrop-blur">
          <MapPin className="h-4 w-4 shrink-0 text-agri-600" />
          <span>
            {currentCoords.length >= 3 ? (
              <>
                Poligon activ: <strong>{currentCoords.length} noduri GPS</strong>
              </>
            ) : (
              <>
                Nicio parcelă selectată <span className="text-slate-400 font-normal">(apasă pe teren sau caută cod)</span>
              </>
            )}
            {showSoils && <span className="ml-1.5 text-emerald-700 font-bold">&bull; Soluri WMS ON</span>}
          </span>
        </div>

        {/* Floating Parcel Card (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 hidden w-64 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-slate-900/15 backdrop-blur md:block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {currentCoords.length >= 3 ? "Parcelă selectată" : "Hartă Moldova"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                currentCoords.length >= 3
                  ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]"
                  : "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.14)]"
              }`}
            />
          </div>
          <div className="mt-3 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900">
                {currentCoords.length >= 3 ? "Parcela activă" : "Selectează parcelă"}
              </p>
              <p className="truncate text-xs font-mono font-semibold text-slate-500">
                {inputCode || cadastralCode ? `#${inputCode || cadastralCode}` : "Apasă pe teren sau caută cod"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
            {calculatedArea > 0 ? calculatedArea.toFixed(2) : "--"}{" "}
            <span className="text-sm font-bold text-slate-400">ha</span>
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="truncate text-slate-500">
              {isAnalyzing
                ? "Se analizează solul..."
                : currentCoords.length >= 3
                ? soilType
                : "Așteptare selecție teren"}
            </span>
            <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
              {isAnalyzing
                ? "..."
                : currentCoords.length >= 3
                ? `${soilBonitate}/100`
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
