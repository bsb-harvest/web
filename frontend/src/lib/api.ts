import { DEFAULT_PARCEL_DATA } from "@/mock/defaultParcelData";
import {
  ParcelAnalysisResponse,
  ParcelAnalyzeRequest,
  SoilProfile,
  ClimateTelemetry,
  ChatMessageResponse,
} from "./types";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export interface AnalyzeParcelParams {
  cadastral_code?: string;
  coordinates: number[][];
  area_ha?: number;
}

export interface AnalyzeParcelResult {
  data: ParcelAnalysisResponse;
  isMock: boolean;
}

/**
 * Trimite cererea de analiză a parcelei către backend-ul FastAPI.
 * În caz de eroare sau dacă backend-ul nu este pornit, face fallback pe Mock Data (Arhitectură Zero-Blocking).
 */
export async function analyzeParcel(
  params: AnalyzeParcelParams
): Promise<AnalyzeParcelResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const payload: ParcelAnalyzeRequest = {
      cadastral_code: params.cadastral_code,
      coordinates: params.coordinates,
      area_ha: params.area_ha,
    };

    const targetUrl = `${API_BASE_URL}/api/v1/parcels/analyze`;
    console.info(`[analyzeParcel] Apel către: ${targetUrl}`, payload);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ParcelAnalysisResponse = await res.json();
      console.info("[analyzeParcel] Răspuns primit de la backend FastAPI:", data.parcel_id);
      return { data, isMock: false };
    } else {
      const errorText = await res.text().catch(() => "");
      console.warn(`[analyzeParcel] Backend a returnat HTTP ${res.status}: ${errorText}`);
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("[analyzeParcel] Timeout depășit (30s) la apelul backend. Se folosește datele locale de rezervă.");
    } else {
      console.warn("[analyzeParcel] Backend FastAPI indisponibil:", err);
    }
  }

  // Fallback garantat Zero-blocking
  return {
    data: {
      ...DEFAULT_PARCEL_DATA,
      cadastral_code: params.cadastral_code || DEFAULT_PARCEL_DATA.cadastral_code,
      area_ha: (params.area_ha && params.area_ha > 0) ? params.area_ha : DEFAULT_PARCEL_DATA.area_ha,
      coordinates:
        params.coordinates && params.coordinates.length >= 3
          ? params.coordinates
          : DEFAULT_PARCEL_DATA.coordinates,
    },
    isMock: true,
  };
}

/**
 * Trimite o întrebare către asistentul conversațional Dr. Agro AI.
 */
export async function sendChatMessage(
  parcelId: string,
  message: string,
  context?: {
    soil_profile?: SoilProfile;
    climate_telemetry?: ClimateTelemetry;
  },
  attachments?: import("./types").ChatAttachment[]
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const chatUrl = `${API_BASE_URL}/api/v1/chat/`;
    console.info(`[sendChatMessage] Apel către: ${chatUrl} (parcelId: ${parcelId})`);

    const res = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parcel_id: parcelId,
        message,
        context,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ChatMessageResponse = await res.json();
      return data.reply;
    } else {
      const errText = await res.text().catch(() => "");
      console.warn(`[sendChatMessage] Backend a returnat HTTP ${res.status}: ${errText}`);
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("[sendChatMessage] Timeout depășit (45s) pentru răspunsul AI Gemini.");
    } else {
      console.warn("Eroare chat backend, generare răspuns local:", err);
    }
  }

  // Răspuns de rezervă când backend-ul nu este activ
  const soilType = context?.soil_profile?.type || "Cernoziom tipic";
  const bonitate = context?.soil_profile?.bonitate_points || 76;
  const moisture = context?.climate_telemetry?.soil_moisture_pct || 42;

  if (message.toLowerCase().includes("azot") || message.toLowerCase().includes("fertiliz")) {
    return `Pentru solul ${soilType} (bonitate ${bonitate}p), la o umiditate a solului de ${moisture}%, recomand aplicarea fracționată a azotului: 60-70 kg N s.a./ha la reluarea vegetației și completare foliară în faza de burduf/înflorire.`;
  }

  if (message.toLowerCase().includes("secet") || message.toLowerCase().includes("apă")) {
    return `La rezerva actuală de umiditate (${moisture}%), este esențială lucrarea minimă a solului (No-Till/Strip-Till) și tăvălugirea imediat după semănat pentru a opri pierderea apei prin capilaritate.`;
  }

  if (message.toLowerCase().includes("asolament") || message.toLowerCase().includes("rotat")) {
    return `Recomand rotația clasică pentru Republica Moldova: Floarea-soarelui -> Grâu de toamnă -> Rapiță/Soia -> Porumb. Evitați floarea-soarelui pe aceeași solă mai des de o dată la 5-6 ani din cauza Sclerotinia.`;
  }

  return `[Dr. Agro AI - Mod Simulare] Pentru parcela dvs. (${soilType}, bonitate ${bonitate} pct, umiditate sol ${moisture}%): Măsurile agrotehnice trebuie calibrate în funcție de prognoza precipitațiilor din următoarele 14 zile. Când conectați backend-ul FastAPI cu Google Gemini, veți primi recomandări particularizate în timp real.`;
}
