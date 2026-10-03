import { NextResponse } from "next/server";

interface CadastreFeature {
  type: string;
  properties: {
    codcadastral?: string;
    cod_parcel?: string;
    aria?: string;
    landuse?: string;
    typeproperty?: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

function isPointInPolygon(point: [number, number], vs: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function simplifyDouglasPeucker(pts: number[][], tol: number = 0.00015): number[][] {
  if (pts.length <= 4) return pts;

  function pldist(p: number[], a: number[], b: number[]): number {
    const x = p[0], y = p[1];
    const x1 = a[0], y1 = a[1];
    const x2 = b[0], y2 = b[1];
    const dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  }

  let dmax = 0;
  let index = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = pldist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > dmax) {
      dmax = d;
      index = i;
    }
  }

  if (dmax > tol) {
    const res1 = simplifyDouglasPeucker(pts.slice(0, index + 1), tol);
    const res2 = simplifyDouglasPeucker(pts.slice(index), tol);
    return res1.slice(0, -1).concat(res2);
  } else {
    return [pts[0], pts[pts.length - 1]];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code");
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");

  // 1. Interogare spațială după coordonate GPS (Click pe hartă)
  if (rawLat && rawLng) {
    const lat = parseFloat(rawLat);
    const lng = parseFloat(rawLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      try {
        const delta = 0.0002;
        const minLng = (lng - delta).toFixed(5);
        const maxLng = (lng + delta).toFixed(5);
        const minLat = (lat - delta).toFixed(5);
        const maxLat = (lat + delta).toFixed(5);

        const bboxFilter = encodeURIComponent(
          `BBOX(geom,${minLng},${minLat},${maxLng},${maxLat},'EPSG:4326')`
        );
        const wfsUrl = `https://geodata.gov.md/geoserver/cadastru_data/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=cadastru_data:terenuri&outputFormat=application/json&cql_filter=${bboxFilter}&srsName=EPSG:4326&maxFeatures=8`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(wfsUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "AgriTech-Moldova-Client/1.0",
          },
          next: { revalidate: 3600 },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const features: CadastreFeature[] = data?.features || [];

          if (features.length > 0) {
            // Căutăm parcela care conține exact punctul apăsat
            let selectedFeature: CadastreFeature | null = null;
            for (const feat of features) {
              const geom = feat.geometry;
              let ring: number[][] = [];
              if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
                ring = geom.coordinates[0];
              } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
                ring = geom.coordinates[0]?.[0] || [];
              }
              if (ring.length >= 3 && isPointInPolygon([lng, lat], ring)) {
                selectedFeature = feat;
                break;
              }
            }

            if (!selectedFeature) {
              selectedFeature = features[0];
            }

            const geom = selectedFeature.geometry;
            let rawCoords: number[][] = [];

            if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
              rawCoords = geom.coordinates[0];
            } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
              rawCoords = geom.coordinates[0]?.[0] || [];
            }

            // Simplificăm poligonul la vârfurile principale (evită blocarea hărții pe sute de puncte)
            const simplified = simplifyDouglasPeucker(rawCoords, 0.00015);
            let coordinates = simplified.map((pt) => [
              Number(pt[0].toFixed(5)),
              Number(pt[1].toFixed(5)),
            ]);

            // Eliminăm punctul final duplicat dacă este identic cu primul (Leaflet închide poligonul automat)
            if (
              coordinates.length > 3 &&
              coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
              coordinates[0][1] === coordinates[coordinates.length - 1][1]
            ) {
              coordinates = coordinates.slice(0, -1);
            }

            let areaHa = 0;
            if (selectedFeature.properties?.aria) {
              const parsed = parseFloat(selectedFeature.properties.aria.replace(",", "."));
              if (!isNaN(parsed) && parsed > 0) {
                areaHa = parsed;
              }
            }

            return NextResponse.json({
              success: true,
              source: "geodata.gov.md",
              parcel: {
                cadastral_code: selectedFeature.properties?.codcadastral || `CAD-${Math.round(lat * 1000)}`,
                parcel_number: selectedFeature.properties?.cod_parcel?.trim(),
                area_ha: areaHa,
                landuse: selectedFeature.properties?.landuse || "Teren agricol",
                property_type: selectedFeature.properties?.typeproperty,
                coordinates,
              },
            });
          }
        }
      } catch (err) {
        console.warn("Eroare interogare spațială geodata.gov.md:", err);
      }

      // Dacă nu există geometrie vectorială oficială la acest pixel exact, generăm o parcelă adaptată
      const halfSize = 0.0035;
      const generatedCoords = [
        [Number((lng - halfSize).toFixed(5)), Number((lat - halfSize).toFixed(5))],
        [Number((lng + halfSize).toFixed(5)), Number((lat - halfSize).toFixed(5))],
        [Number((lng + halfSize).toFixed(5)), Number((lat + halfSize).toFixed(5))],
        [Number((lng - halfSize).toFixed(5)), Number((lat + halfSize).toFixed(5))],
      ];

      return NextResponse.json({
        success: true,
        source: "gps_click",
        parcel: {
          cadastral_code: `P-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`,
          parcel_number: "Custom GPS",
          area_ha: 5.8,
          landuse: "Teren agricol selectat prin click",
          coordinates: generatedCoords,
        },
      });
    }
  }

  // 2. Interogare după cod cadastral
  if (!rawCode) {
    return NextResponse.json(
      { success: false, message: "Parametrul 'code' sau ('lat' și 'lng') este obligatoriu." },
      { status: 400 }
    );
  }

  // Curățare cod cadastral (eliminare spații, puncte, liniuțe)
  const cleanCode = rawCode.trim().replace(/[\s\.\-_]/g, "");

  try {
    // 1. Interogare oficială geodata.gov.md (WFS cu proiecție WGS84 EPSG:4326)
    const exactFilter = encodeURIComponent(`codcadastral='${cleanCode}'`);
    const wfsUrl = `https://geodata.gov.md/geoserver/cadastru_data/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=cadastru_data:terenuri&outputFormat=application/json&cql_filter=${exactFilter}&srsName=EPSG:4326&maxFeatures=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let res = await fetch(wfsUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AgriTech-Moldova-Client/1.0",
      },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    let data = res.ok ? await res.json() : null;
    let features: CadastreFeature[] = data?.features || [];

    // 2. Dacă nu a găsit exact și are cel puțin 6 caractere, încercăm cu prefix (LIKE)
    if (features.length === 0 && cleanCode.length >= 6) {
      const prefixFilter = encodeURIComponent(`codcadastral LIKE '${cleanCode}%'`);
      const prefixUrl = `https://geodata.gov.md/geoserver/cadastru_data/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=cadastru_data:terenuri&outputFormat=application/json&cql_filter=${prefixFilter}&srsName=EPSG:4326&maxFeatures=1`;

      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 5000);
      const res2 = await fetch(prefixUrl, { signal: c2.signal });
      clearTimeout(t2);

      if (res2.ok) {
        const d2 = await res2.json();
        features = d2?.features || [];
      }
    }

    if (features.length > 0) {
      const f = features[0];
      const geom = f.geometry;
      let rawCoords: number[][] = [];

      if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
        rawCoords = geom.coordinates[0]; // exterior ring
      } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
        rawCoords = geom.coordinates[0]?.[0] || [];
      }

      // Simplificăm poligonul la vârfurile principale
      const simplified = simplifyDouglasPeucker(rawCoords, 0.00015);
      let coordinates = simplified.map((pt) => [
        Number(pt[0].toFixed(5)),
        Number(pt[1].toFixed(5)),
      ]);

      if (
        coordinates.length > 3 &&
        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
        coordinates[0][1] === coordinates[coordinates.length - 1][1]
      ) {
        coordinates = coordinates.slice(0, -1);
      }

      // Parsare arie din stringul geodata (ex: "11.81 ha")
      let areaHa = 0;
      if (f.properties?.aria) {
        const parsed = parseFloat(f.properties.aria.replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          areaHa = parsed;
        }
      }

      return NextResponse.json({
        success: true,
        source: "geodata.gov.md",
        parcel: {
          cadastral_code: f.properties?.codcadastral || cleanCode,
          parcel_number: f.properties?.cod_parcel?.trim(),
          area_ha: areaHa,
          landuse: f.properties?.landuse || "Teren agricol",
          property_type: f.properties?.typeproperty,
          coordinates,
        },
      });
    }
  } catch (err) {
    console.warn("Eroare interogare geodata.gov.md:", err);
  }

  // 3. Fallback pe mostre locale dacă codul corespunde uneia dintre parcelele de test
  const LOCAL_PRESETS: Record<string, { name: string; coords: number[][]; area_ha: number }> = {
    "0100123456": {
      name: "Chișinău Central",
      coords: [
        [28.8300, 47.0100],
        [28.8450, 47.0100],
        [28.8450, 47.0220],
        [28.8300, 47.0220],
      ],
      area_ha: 15.5,
    },
    "0300987654": {
      name: "Bălți Nord",
      coords: [
        [27.9150, 47.7550],
        [27.9350, 47.7550],
        [27.9350, 47.7700],
        [27.9150, 47.7700],
      ],
      area_ha: 28.4,
    },
    "1700456123": {
      name: "Cahul Sud",
      coords: [
        [28.1800, 45.8950],
        [28.2000, 45.8950],
        [28.2000, 45.9120],
        [28.1800, 45.9120],
      ],
      area_ha: 42.0,
    },
    "6400789456": {
      name: "Orhei Codru",
      coords: [
        [28.8100, 47.3750],
        [28.8300, 47.3750],
        [28.8300, 47.3900],
        [28.8100, 47.3900],
      ],
      area_ha: 18.2,
    },
  };

  if (LOCAL_PRESETS[cleanCode]) {
    const p = LOCAL_PRESETS[cleanCode];
    return NextResponse.json({
      success: true,
      source: "local_registry",
      parcel: {
        cadastral_code: cleanCode,
        area_ha: p.area_ha,
        landuse: "Teren agricol arabil",
        coordinates: p.coords,
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      message: `Numărul cadastral '${cleanCode}' nu a fost identificat în registrul deschis geodata.gov.md.`,
    },
    { status: 404 }
  );
}
