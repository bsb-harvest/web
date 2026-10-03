"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  RotateCcw,
  Sparkles,
  Edit3,
  Check,
  X,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  Info,
} from "lucide-react";
import {
  PRELOADED_PARCELS,
  findPreloadedParcel,
} from "@/mock/preloadedParcels";

interface ParcelMapProps {
  coordinates: number[][]; // [[lng, lat], ...]
  areaHa: number;
  cadastralCode?: string | null;
  onPolygonChange: (coords: number[][]) => void;
  onAnalyze: (cadastralCode?: string, overrideCoords?: number[][]) => void;
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
      [28.8300, 47.0220],
    ],
  },
  {
    name: "Taraclia (Sud)",
    code: "94162160609",
    coords: [
      [28.29422, 45.72577],
      [28.29402, 45.72640],
      [28.29307, 45.72704],
      [28.29158, 45.72722],
      [28.29112, 45.72553],
      [28.28976, 45.72373],
      [28.29228, 45.72397],
      [28.29422, 45.72577],
    ],
  },
  {
    name: "Bălți (Nord)",
    code: "0300987654",
    coords: [
      [27.9150, 47.7550],
      [27.9350, 47.7550],
      [27.9350, 47.7700],
      [27.9150, 47.7700],
    ],
  },
  {
    name: "Cahul (Sud)",
    code: "1700456123",
    coords: [
      [28.1800, 45.8950],
      [28.2000, 45.8950],
      [28.2000, 45.9120],
      [28.1800, 45.9120],
    ],
  },
  {
    name: "Orhei (Codru)",
    code: "6400789456",
    coords: [
      [28.8100, 47.3750],
      [28.8300, 47.3750],
      [28.8300, 47.3900],
      [28.8100, 47.3900],
    ],
  },
];

function calculatePolygonAreaHa(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;
  const totalLng = coords.reduce((acc, c) => acc + c[0], 0);
  const totalLat = coords.reduce((acc, c) => acc + c[1], 0);
  const centerLng = totalLng / coords.length;
  const centerLat = totalLat / coords.length;

  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = 111320.0;
  const metersPerDegLng = 111320.0 * Math.cos(latRad);

  const ptsM = coords.map((c) => [
    (c[0] - centerLng) * metersPerDegLng,
    (c[1] - centerLat) * metersPerDegLat,
  ]);

  let areaM2 = 0;
  const n = ptsM.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    areaM2 += ptsM[i][0] * ptsM[j][1];
    areaM2 -= ptsM[j][0] * ptsM[i][1];
  }
  areaM2 = Math.abs(areaM2) / 2.0;
  return Math.max(0.01, Number((areaM2 / 10000.0).toFixed(2)));
}

export const ParcelMap: React.FC<ParcelMapProps> = ({
  coordinates,
  areaHa,
  cadastralCode,
  onPolygonChange,
  onAnalyze,
  isAnalyzing,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const drawLayerRef = useRef<any>(null);
  const cadastreLayerRef = useRef<any>(null);
  const soilLayerRef = useRef<any>(null);
  const tileLayersRef = useRef<{ [key: string]: any }>({});
  const leafletRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<number[][]>(coordinates);
  const [calculatedArea, setCalculatedArea] = useState<number>(areaHa || calculatePolygonAreaHa(coordinates));
  const [inputCode, setInputCode] = useState<string>(cadastralCode || "0100123456");
  const [activeLayer, setActiveLayer] = useState<"satellite" | "standard">("satellite");
  const [showCadastre, setShowCadastre] = useState<boolean>(false);
  const [showSoils, setShowSoils] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

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

  // Actualizare poligon pe hartă cu markere de colț
  const renderPolygon = useCallback(
    (L: any, coords: number[][], fitBounds: boolean = false) => {
      if (!coords || coords.length < 3 || !polygonRef.current) return;

      // Elimină puncte identice consecutive
      const clean = coords.filter((pt, i) => {
        if (i === 0) return true;
        const prev = coords[i - 1];
        return Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 0.00002;
      });

      const latLngs = clean.map((pt) => [pt[1], pt[0]]);
      polygonRef.current.setLatLngs(latLngs as any);

      // Curățăm markerele vechi
      if (markersGroupRef.current) {
        markersGroupRef.current.clearLayers();

        // Markere de modificare colțuri doar pentru poligoane cu <= 30 noduri
        if (latLngs.length <= 30) {
          const cornerIcon = L.divIcon({
            className: "corner-handle",
            html: `<div style="
              width: 16px;
              height: 16px;
              background: #ffffff;
              border: 3.5px solid #16a34a;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.45);
              cursor: grab;
              transform: translate(-8px, -8px);
            "></div>`,
            iconSize: [0, 0],
          });

          const working = [...latLngs];

          latLngs.forEach((latLng, idx) => {
            const marker = L.marker(latLng as any, {
              draggable: true,
              icon: cornerIcon,
              title: `Colț #${idx + 1} (Trage cu mouse-ul pentru a ajusta conturul)`,
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
          padding: [45, 45],
          maxZoom: 16,
          animate: true,
        });
      }
    },
    [onPolygonChange]
  );

  // Click pe hartă pentru identificare parcelă
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (isDrawingRef.current) return;

      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      // 1. Verificare instantă în baza demonstrativă locală
      const localMatch = findPreloadedParcel(lat, lng);
      if (localMatch) {
        setInputCode(localMatch.cadastral_code);
        setCurrentCoords(localMatch.coordinates);
        setCalculatedArea(localMatch.area_ha);
        onPolygonChange(localMatch.coordinates);
        renderPolygon(L, localMatch.coordinates, false);
        onAnalyze(localMatch.cadastral_code, localMatch.coordinates);
        setStatusMessage({
          type: "success",
          text: `Parcelă selectată (${localMatch.region}): Cod ${localMatch.cadastral_code} • ${localMatch.area_ha} ha • ${localMatch.name}`,
        });
        return;
      }

      // 2. Interogare spațială geodata.gov.md
      setStatusMessage({
        type: "warning",
        text: `Se verifică parcela cadastrală la [${lat.toFixed(4)}, ${lng.toFixed(4)}]...`,
      });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`/api/cadastre?lat=${lat}&lng=${lng}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json();

        if (res.ok && data.success && data.parcel?.coordinates?.length >= 3) {
          const p = data.parcel;
          setInputCode(p.cadastral_code);
          setCurrentCoords(p.coordinates);
          const computedArea = p.area_ha || calculatePolygonAreaHa(p.coordinates);
          setCalculatedArea(computedArea);
          onPolygonChange(p.coordinates);
          renderPolygon(L, p.coordinates, false);
          onAnalyze(p.cadastral_code, p.coordinates);

          setStatusMessage({
            type: "success",
            text: `Parcelă identificată (geodata.gov.md): Cod ${p.cadastral_code} • ${computedArea} ha${
              p.landuse ? ` • ${p.landuse}` : ""
            }`,
          });
          return;
        }
      } catch {
        // Fallback adaptiv în caz de timeout extern
      }

      // 3. Fallback adaptiv dacă nu există geometrie oficială la acest punct
      const delta = 0.003;
      const fallbackCoords = [
        [Number((lng - delta).toFixed(5)), Number((lat - delta).toFixed(5))],
        [Number((lng + delta).toFixed(5)), Number((lat - delta).toFixed(5))],
        [Number((lng + delta).toFixed(5)), Number((lat + delta).toFixed(5))],
        [Number((lng - delta).toFixed(5)), Number((lat + delta).toFixed(5))],
      ];

      const customCode = `GPS-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`;
      setInputCode(customCode);
      setCurrentCoords(fallbackCoords);
      const customArea = calculatePolygonAreaHa(fallbackCoords);
      setCalculatedArea(customArea);
      onPolygonChange(fallbackCoords);
      renderPolygon(L, fallbackCoords, false);
      onAnalyze(customCode, fallbackCoords);

      setStatusMessage({
        type: "success",
        text: `Zonă selectată la [${lat.toFixed(4)}, ${lng.toFixed(4)}] • ~${customArea} ha. Puteți trage de cercurile albe pentru ajustarea conturului.`,
      });
    },
    [onPolygonChange, onAnalyze, renderPolygon]
  );

  // Inițializare hartă
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;
      leafletRef.current = L;

      // Fix iconițe implicite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenterLat = coordinates[0]?.[1] || 47.0105;
      const initialCenterLng = coordinates[0]?.[0] || 28.8350;

      const map = L.map(containerRef.current, {
        center: [initialCenterLat, initialCenterLng],
        zoom: 14,
        maxZoom: 20,
        zoomControl: true,
      });

      // ========================================================
      // 1. Panouri dedicate Leaflet (Z-Index garantat)
      // Plăcile satelit sunt la z-index: 200 (tilePane)
      // Harta solurilor la z-index: 350 (soilPane)
      // Delimitările și codurile Cadastru la z-index: 450 (cadastrePane)
      // Poligonul activ selectat la z-index: 500 (activeParcelPane)
      // Etichetele cu orașe, străzi și granițe la z-index: 600 (labelsPane) -> MEREU DEASUPRA solurilor!
      // ========================================================
      map.createPane("soilPane");
      const sPane = map.getPane("soilPane") as HTMLElement;
      sPane.style.zIndex = "350";
      sPane.style.pointerEvents = "none";

      map.createPane("cadastrePane");
      const cPane = map.getPane("cadastrePane") as HTMLElement;
      cPane.style.zIndex = "450";
      cPane.style.pointerEvents = "none"; // Clicurile trec direct prin delimitări spre hartă!

      map.createPane("activeParcelPane");
      (map.getPane("activeParcelPane") as HTMLElement).style.zIndex = "500";

      map.createPane("labelsPane");
      const lPane = map.getPane("labelsPane") as HTMLElement;
      lPane.style.zIndex = "600";
      lPane.style.pointerEvents = "none"; // Clicurile trec direct spre hartă!

      if (map.getPane("markerPane")) {
        (map.getPane("markerPane") as HTMLElement).style.zIndex = "700";
      }

      // 2. Straturi Satelit + Hartă obișnuită
      // Satelit Google pur la z-index 200 + Etichete orașe/străzi/granițe la 600 (peste soluri)
      const satelliteLayer = L.tileLayer(
        "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          subdomains: "0123",
          attribution: "&copy; Google Maps",
        }
      );
      const satelliteLabels = L.tileLayer(
        "https://mt{s}.google.com/vt/lyrs=h&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          subdomains: "0123",
          pane: "labelsPane",
        }
      );

      // Hartă obișnuită (străzi / topografie)
      const standardLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }
      );

      // Activare inițială Satelit + Etichete deasupra solurilor
      satelliteLayer.addTo(map);
      satelliteLabels.addTo(map);

      tileLayersRef.current = {
        satellite: satelliteLayer,
        satelliteLabels: satelliteLabels,
        standard: standardLayer,
      };

      // 3. Strat Harta Solurilor Moldovei (soluri.gov.md / IPM Dimo) - Nivel 350
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
          attribution: "&copy; soluri.gov.md — Institutul de Pedologie „Nicolae Dimo”",
        }
      );

      if (showSoils) {
        soilWms.addTo(map);
      }
      soilLayerRef.current = soilWms;

      // 4. Strat Cadastral Oficial (WMS geodata.gov.md) - Nivel 450 (Peste satelit și soluri)
      const cadastreWms = (L.tileLayer as any).wms(
        "https://geodata.gov.md/geoserver/cadastru_data/wms",
        {
          layers: "cadastru_data:sector_cadastral",
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          maxZoom: 20,
          minZoom: 11,
          opacity: 0.8,
          pane: "cadastrePane",
          attribution: "&copy; geodata.gov.md — Cadastru Oficial",
        }
      );

      const cadastreGroup = L.layerGroup([], { pane: "cadastrePane" } as any);
      cadastreGroup.addLayer(cadastreWms);

      // Contururile parcelelor demonstrative cu coduri
      PRELOADED_PARCELS.forEach((p) => {
        const pLat = p.coordinates.map((pt) => [pt[1], pt[0]]);
        const pPoly = L.polygon(pLat as any, {
          pane: "cadastrePane",
          color: "#f59e0b",
          weight: 2,
          dashArray: "4, 4",
          fillColor: "#fbbf24",
          fillOpacity: 0.18,
        });
        pPoly.bindTooltip(
          `<strong>${p.name}</strong><br/>Cod: ${p.cadastral_code} • ${p.area_ha} ha`,
          { sticky: true }
        );
        cadastreGroup.addLayer(pPoly);
      });

      if (showCadastre) {
        cadastreGroup.addTo(map);
      }
      cadastreLayerRef.current = cadastreGroup;

      // 5. Poligonul activ al parcelei selectate - Nivel 500
      const polygon = L.polygon([], {
        pane: "activeParcelPane",
        color: "#16a34a",
        weight: 3.5,
        fillColor: "#22c55e",
        fillOpacity: 0.35,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const drawLayer = L.layerGroup().addTo(map);

      mapRef.current = map;
      polygonRef.current = polygon;
      markersGroupRef.current = markersGroup;
      drawLayerRef.current = drawLayer;

      // Event-uri click
      map.on("click", (e: any) => {
        if (isDrawingRef.current) {
          const pt = [Number(e.latlng.lng.toFixed(5)), Number(e.latlng.lat.toFixed(5))];
          const newPts = [...drawPointsRef.current, pt];
          drawPointsRef.current = newPts;
          setDrawPoints(newPts);

          if (drawLayerRef.current) {
            drawLayerRef.current.clearLayers();
            const latLngs = newPts.map((p) => [p[1], p[0]]);
            if (latLngs.length > 1) {
              L.polyline(latLngs as any, { color: "#3b82f6", weight: 2.5, dashArray: "5, 5" }).addTo(
                drawLayerRef.current
              );
            }
            latLngs.forEach((pt) => {
              L.circleMarker(pt as any, { radius: 5, color: "#2563eb", fillColor: "#ffffff", fillOpacity: 1 }).addTo(
                drawLayerRef.current
              );
            });
          }
        } else {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      polygon.on("click", (e: any) => {
        L.DomEvent.stopPropagation(e);
        if (!isDrawingRef.current) {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      // Asigurăm încărcarea completă a tile-urilor pe toată suprafața containerului
      const invalidate = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      };
      setTimeout(invalidate, 100);
      setTimeout(invalidate, 300);
      setTimeout(invalidate, 600);

      // Afișăm poligonul inițial și centrăm
      renderPolygon(L, coordinates, true);
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

  // Sincronizare la modificarea coordonatelor externe
  useEffect(() => {
    if (coordinates && coordinates.length >= 3 && leafletRef.current && mapRef.current) {
      setCurrentCoords(coordinates);
      setCalculatedArea(calculatePolygonAreaHa(coordinates));
      renderPolygon(leafletRef.current, coordinates, false);
    }
  }, [coordinates, renderPolygon]);

  // Schimbare strat: Satelit sau Hartă obișnuită
  const switchBaseLayer = (type: "satellite" | "standard") => {
    const map = mapRef.current;
    const layers = tileLayersRef.current;
    if (!map || !layers) return;

    Object.keys(layers).forEach((k) => {
      if (map.hasLayer(layers[k])) {
        map.removeLayer(layers[k]);
      }
    });

    if (type === "satellite") {
      if (layers.satellite) {
        map.addLayer(layers.satellite);
      }
      if (layers.satelliteLabels) {
        map.addLayer(layers.satelliteLabels);
      }
    } else {
      if (layers.standard) {
        map.addLayer(layers.standard);
      }
    }
    setActiveLayer(type);
  };

  // Activare / Dezactivare Strat Cadastru
  const toggleCadastre = () => {
    const map = mapRef.current;
    const layer = cadastreLayerRef.current;
    if (!map || !layer) return;

    if (showCadastre) {
      map.removeLayer(layer);
      setShowCadastre(false);
    } else {
      map.addLayer(layer);
      setShowCadastre(true);
      if (map.getZoom() < 12) {
        map.setZoom(13);
      }
    }
  };

  // Activare / Dezactivare Strat Soluri
  const toggleSoils = () => {
    const map = mapRef.current;
    const layer = soilLayerRef.current;
    if (!map || !layer) return;

    if (showSoils) {
      map.removeLayer(layer);
      setShowSoils(false);
    } else {
      map.addLayer(layer);
      setShowSoils(true);
    }
  };

  // Căutare număr cadastral
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCode.trim().replace(/[\s\.\-_]/g, "");
    if (!clean || isSearching) return;

    // 1. Verificare preset
    const localMatch = PRELOADED_PARCELS.find(
      (p) => p.cadastral_code === clean || p.cadastral_code.includes(clean)
    );
    if (localMatch) {
      setInputCode(localMatch.cadastral_code);
      setCurrentCoords(localMatch.coordinates);
      setCalculatedArea(localMatch.area_ha);
      onPolygonChange(localMatch.coordinates);
      if (leafletRef.current) renderPolygon(leafletRef.current, localMatch.coordinates, true);
      onAnalyze(localMatch.cadastral_code, localMatch.coordinates);
      setStatusMessage({
        type: "success",
        text: `Parcelă identificată: ${localMatch.name} (Cod: ${localMatch.cadastral_code} • ${localMatch.area_ha} ha)`,
      });
      return;
    }

    // 2. Interogare API cadastre
    setIsSearching(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/cadastre?code=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (res.ok && data.success && data.parcel?.coordinates?.length >= 3) {
        const p = data.parcel;
        setInputCode(p.cadastral_code);
        setCurrentCoords(p.coordinates);
        const computedArea = p.area_ha || calculatePolygonAreaHa(p.coordinates);
        setCalculatedArea(computedArea);
        onPolygonChange(p.coordinates);
        if (leafletRef.current) renderPolygon(leafletRef.current, p.coordinates, true);
        onAnalyze(p.cadastral_code, p.coordinates);

        setStatusMessage({
          type: "success",
          text: `Parcelă identificată (${data.source}): Cod ${p.cadastral_code} • ${computedArea} ha${
            p.landuse ? ` • ${p.landuse}` : ""
          }`,
        });
      } else {
        setStatusMessage({
          type: "warning",
          text: data.message || `Numărul cadastral '${clean}' nu a fost găsit în baza de date.`,
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Eroare la conectarea cu serviciul cadastral.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Selectare preset
  const handleSelectPreset = (p: typeof PRESET_PARCELS[0]) => {
    if (isDrawing) cancelDrawing();
    setInputCode(p.code);
    setCurrentCoords(p.coords);
    const newArea = calculatePolygonAreaHa(p.coords);
    setCalculatedArea(newArea);
    onPolygonChange(p.coords);
    setStatusMessage(null);
    if (leafletRef.current) renderPolygon(leafletRef.current, p.coords, true);
    onAnalyze(p.code, p.coords);
  };

  // Mod desenare manuală
  const startDrawing = () => {
    setIsDrawing(true);
    setDrawPoints([]);
    drawPointsRef.current = [];
    setStatusMessage(null);
    if (markersGroupRef.current) markersGroupRef.current.clearLayers();
    if (polygonRef.current) polygonRef.current.setLatLngs([]);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
  };

  const finishDrawing = () => {
    if (drawPoints.length < 3) return;
    setIsDrawing(false);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();

    setCurrentCoords(drawPoints);
    const newArea = calculatePolygonAreaHa(drawPoints);
    setCalculatedArea(newArea);
    onPolygonChange(drawPoints);
    if (leafletRef.current) renderPolygon(leafletRef.current, drawPoints, true);
    onAnalyze(inputCode, drawPoints);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
    drawPointsRef.current = [];
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    if (leafletRef.current) renderPolygon(leafletRef.current, currentCoords, true);
  };

  // Recentrare pe parcelă
  const handleResetCenter = () => {
    if (polygonRef.current && mapRef.current) {
      mapRef.current.fitBounds(polygonRef.current.getBounds(), {
        padding: [45, 45],
        maxZoom: 16,
        animate: true,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Bara superioară cu mostre și selecție straturi */}
      <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
        {/* Mostre Moldova */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Zone:
          </span>
          {PRESET_PARCELS.map((p) => (
            <button
              key={p.code}
              onClick={() => handleSelectPreset(p)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-agri-500 hover:text-agri-700 transition-colors whitespace-nowrap shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Butoane acțiune & Straturi */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Filtru Cadastru Oficial */}
          <button
            onClick={toggleCadastre}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
              showCadastre
                ? "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300/40"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Afișează/Ascunde delimitările cadastrale și numerele de parcele (geodata.gov.md)"
          >
            <Building2 className={`w-3.5 h-3.5 ${showCadastre ? "text-amber-600" : "text-slate-400"}`} />
            <span>Filtru Cadastru</span>
            <span className={`w-2 h-2 rounded-full ${showCadastre ? "bg-amber-500" : "bg-slate-300"}`} />
          </button>

          {/* Toggle Harta Solurilor soluri.gov.md */}
          <button
            onClick={toggleSoils}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
              showSoils
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-300/40"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Afișează/Ascunde Harta Pedologică a Solurilor Moldovei (soluri.gov.md)"
          >
            <Layers className={`w-3.5 h-3.5 ${showSoils ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Harta Solurilor</span>
            <span className={`w-2 h-2 rounded-full ${showSoils ? "bg-emerald-500" : "bg-slate-300"}`} />
          </button>

          {/* Buton Desenare */}
          {!isDrawing ? (
            <button
              onClick={startDrawing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Click pe hartă pentru a delimita o parcelă nouă punct cu punct"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Desenează contur</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 p-1 rounded-lg">
              <button
                onClick={finishDrawing}
                disabled={drawPoints.length < 3}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finalizează ({drawPoints.length} puncte)</span>
              </button>
              <button
                onClick={cancelDrawing}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-white text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                <span>Anulează</span>
              </button>
            </div>
          )}

          {/* Reset Zoom */}
          <button
            onClick={handleResetCenter}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Recentrează pe parcelă"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Schimbător Strat: Satelit / Hartă obișnuită */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => switchBaseLayer("satellite")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeLayer === "satellite"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Satelit
            </button>
            <button
              onClick={() => switchBaseLayer("standard")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeLayer === "standard"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hartă obișnuită
            </button>
          </div>
        </div>
      </div>

      {/* 2. Formular căutare cod cadastral & buton analiză */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Cod cadastral (ex: 01492010213, 01002010953)..."
              className="w-full pl-9 pr-24 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={isSearching || !inputCode.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1 shadow-2xs"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Caută...</span>
                </>
              ) : (
                <span>Identifică</span>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Suprafață:</div>
            <div className="text-base font-extrabold text-emerald-800">
              {calculatedArea.toFixed(2)} ha
            </div>
          </div>

          <button
            onClick={() => onAnalyze(inputCode, currentCoords)}
            disabled={isAnalyzing || isDrawing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Se analizează..." : "Analizează Sol & Recoltă"}</span>
          </button>
        </div>
      </div>

      {/* 3. Container Hartă Leaflet */}
      <div className="relative w-full h-[450px] sm:h-[520px] bg-slate-900 overflow-hidden isolate">
        <div
          ref={containerRef}
          className={`w-full h-full relative z-0 ${isDrawing ? "cursor-crosshair" : "cursor-pointer"}`}
          style={{ zIndex: 0 }}
        />

        {/* Legendă Soluri (soluri.gov.md) */}
        {showSoils && isLegendOpen && (
          <div
            className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs max-w-[290px] space-y-2 animate-in fade-in duration-200"
            style={{ zIndex: 1000 }}
          >
            <div className="font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Legendă Soluri (soluri.gov.md)
              </span>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
                title="Ascunde legenda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[11px] leading-tight">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: "#3d2817" }} />
                <span className="text-slate-700"><strong>Cernoziom tipic/moderat</strong> (Bălți, Soroca)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: "#5c4033" }} />
                <span className="text-slate-700"><strong>Cernoziom levigat</strong> (Glodeni, Fălești)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: "#8c6747" }} />
                <span className="text-slate-700"><strong>Soluri cenușii de pădure</strong> (Codru, Orhei)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: "#a07855" }} />
                <span className="text-slate-700"><strong>Cernoziom carbonatic/sudic</strong> (Cahul, Comrat)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: "#4a6b82" }} />
                <span className="text-slate-700"><strong>Soluri aluviale / luncă</strong> (Prut, Nistru)</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 italic">
              Sursa: Institutul de Pedologie „N. Dimo” &amp; soluri.gov.md
            </div>
          </div>
        )}

        {/* Buton redeschidere legendă */}
        {showSoils && !isLegendOpen && (
          <button
            onClick={() => setIsLegendOpen(true)}
            className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-white"
            style={{ zIndex: 1000 }}
          >
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Legendă Soluri</span>
          </button>
        )}

        {/* Notificare plutitoare */}
        {statusMessage ? (
          <div
            className={`absolute top-3 left-14 right-14 sm:right-auto sm:max-w-xl z-[1000] px-3.5 py-2 text-xs font-semibold rounded-xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3 border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
              statusMessage.type === "success"
                ? "bg-slate-900/90 text-emerald-300 border-emerald-500/60"
                : statusMessage.type === "warning"
                ? "bg-slate-900/90 text-amber-300 border-amber-500/60"
                : "bg-slate-900/90 text-rose-300 border-rose-500/60"
            }`}
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0"
              title="Închide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !isDrawing ? (
          <div
            className="absolute top-3 left-14 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-700 flex items-center gap-2"
            style={{ zIndex: 1000 }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              💡 <strong>Interactiv:</strong> Click pe orice parcelă de pe hartă pentru a o selecta din Cadastru, sau trage de colțuri pentru ajustare.
            </span>
          </div>
        ) : null}

        {/* Bară de stare jos */}
        <div
          className="absolute bottom-2 left-3 z-[1000] bg-white/90 backdrop-blur-xs px-3 py-1 rounded-md border border-slate-200 text-xs text-slate-700 shadow-sm flex items-center gap-2"
          style={{ zIndex: 1000 }}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Poligon: <strong>{currentCoords.length} puncte GPS</strong> &bull; Suprafață:{" "}
            <strong>{calculatedArea.toFixed(2)} ha</strong>
          </span>
          {showCadastre && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              Cadastru Activ
            </span>
          )}
          {showSoils && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Soluri Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
