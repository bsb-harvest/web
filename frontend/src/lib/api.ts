import { DEFAULT_PARCEL_DATA } from "@/mock/defaultParcelData";
import {
  ParcelAnalysisResponse,
  ParcelAnalyzeRequest,
  SoilProfile,
  ClimateTelemetry,
  ChatMessageResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyzeParcelParams {
  cadastral_code?: string;
  coordinates: number[][];
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const payload: ParcelAnalyzeRequest = {
      cadastral_code: params.cadastral_code,
      coordinates: params.coordinates,
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/parcels/analyze`, {
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
      return { data, isMock: false };
    }
  } catch (err) {
    console.warn("Backend FastAPI indisponibil, folosire fallback Mock:", err);
  }

  // Fallback garantat Zero-blocking
  return {
    data: {
      ...DEFAULT_PARCEL_DATA,
      cadastral_code: params.cadastral_code || DEFAULT_PARCEL_DATA.cadastral_code,
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
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
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
    }
  } catch (err) {
    console.warn("Eroare chat backend, generare răspuns local:", err);
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
