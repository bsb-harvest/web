"use client";

import React, { useState } from "react";
import { SoilProfile, ClimateTelemetry, AIGuidance } from "@/lib/types";
import {
  Layers,
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Thermometer,
  Wind,
  Gauge,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface ParcelInfoCardProps {
  soil: SoilProfile;
  climate: ClimateTelemetry;
  aiGuidance: AIGuidance;
}

// Baza de date cu profilurile solurilor din Moldova (soluri.gov.md)
const MOLDOVA_SOIL_CATALOG = [
  {
    type: "Cernoziom levigat și tipic lutos",
    region: "Nord (Bălți, Edineț, Soroca)",
    bonitate: 84,
    humus: "4.0 - 4.5%",
    ph: "6.6 - 7.0 (Neutru)",
    color: "from-amber-700 to-amber-900",
    description: "Cele mai fertile soluri din Moldova, cu textură lutoasă și capacitate excepțională de reținere a apei.",
    bestCrops: "Grâu, Sfeclă de zahăr, Soia, Rapiță",
  },
  {
    type: "Cernoziom tipic moderat humifer",
    region: "Centru (Chișinău, Orhei, Strășeni)",
    bonitate: 76,
    humus: "3.5 - 4.0%",
    ph: "7.0 - 7.4 (Slab alcalin)",
    color: "from-amber-600 to-amber-800",
    description: "Sol echilibrat agrotehnic, profil profund, favorabil majorității culturilor de câmp și livezilor.",
    bestCrops: "Floarea-soarelui, Grâu de toamnă, Porumb",
  },
  {
    type: "Cernoziom carbonatic și xerofitic de stepă",
    region: "Sud (Cahul, Comrat, Taraclia)",
    bonitate: 68,
    humus: "2.8 - 3.4%",
    ph: "7.6 - 8.2 (Alcalin/Carbonatic)",
    color: "from-yellow-700 to-amber-700",
    description: "Format în condiții de deficit de precipitații; bogat în carbonați de calciu liber, sensibil la secetă.",
    bestCrops: "Floarea-soarelui, Sorg, Viță-de-vie, Orz",
  },
  {
    type: "Cernoziom cambic profund",
    region: "Silvostepă (Fălești, Glodeni)",
    bonitate: 80,
    humus: "3.8 - 4.2%",
    ph: "6.8 - 7.2 (Neutru)",
    color: "from-stone-700 to-amber-800",
    description: "Sol profund cu orizont cambic bine structurat și fertilitate naturală ridicată.",
    bestCrops: "Porumb, Grâu, Rapiță de toamnă",
  },
  {
    type: "Sol cenușiu de pădure",
    region: "Podișul Codrilor (Călărași, Nisporeni)",
    bonitate: 72,
    humus: "2.8 - 3.5%",
    ph: "6.2 - 6.6 (Slab acid)",
    color: "from-slate-600 to-amber-900",
    description: "Sol dezvoltat sub păduri de foioase; relief fragmentat, predispus la eroziune hidrică pe pante.",
    bestCrops: "Livezi (măr, prun), Viță-de-vie, Cereale",
  },
  {
    type: "Sol aluvial de luncă",
    region: "Văile râurilor Prut și Nistru",
    bonitate: 78,
    humus: "3.2 - 3.8%",
    ph: "7.2 - 7.6 (Slab alcalin)",
    color: "from-emerald-800 to-amber-900",
    description: "Soluri tinere formate prin depuneri aluvionare periodice; pânză freatică accesibilă rădăcinilor.",
    bestCrops: "Legume, Porumb pentru siloz, Lucernă",
  },
];

export const ParcelInfoCard: React.FC<ParcelInfoCardProps> = ({
  soil,
  climate,
  aiGuidance,
}) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Clasificare calitativă a solului după bonitate (1-100)
  const getBonitateRating = (score: number) => {
    if (score >= 80) return { label: "Clasa I • Fertilitate Superioară", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 70) return { label: "Clasa II • Fertilitate Bună", color: "text-teal-700 bg-teal-50 border-teal-200" };
    if (score >= 60) return { label: "Clasa III • Fertilitate Medie", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Clasa IV • Fertilitate Limitată", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const rating = getBonitateRating(soil.bonitate_points);

  // Procentaj indicator pH (de la 5.5 la 8.5)
  const phClamped = Math.max(5.5, Math.min(8.5, soil.ph));
  const phPercent = ((phClamped - 5.5) / (8.5 - 5.5)) * 100;

  return (
    <div className="space-y-4">
      {/* 2-Column Grid for Soil and Meteo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Soil Profile Card (soluri.gov.md) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Profil Pedologic Detaliat
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      soluri.gov.md
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Baza de date a calității solurilor din Republica Moldova
                  </p>
                </div>
              </div>

              <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${rating.color}`}>
                {soil.bonitate_points} pct.
              </div>
            </div>

            {/* Soil Type Banner */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Tip &amp; Subtip Genetic de Sol
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {soil.type}
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                {rating.label} &bull; Relief specific Moldovei cu textură lutoasă
              </p>
            </div>

            {/* Visual Gauges: Bonitate, Humus, pH, Eroziune */}
            <div className="space-y-2.5 pt-1">
              {/* 1. Bonitate Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Nota de Bonitate:
                  </span>
                  <span className="text-slate-900 font-bold">{soil.bonitate_points} / 100</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-700"
                    style={{ width: `${soil.bonitate_points}%` }}
                  />
                </div>
              </div>

              {/* 2. Visual pH Spectrum (Acid -> Neutru -> Alcalin) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" /> Reacția Solului (pH):
                  </span>
                  <span className="text-slate-900 font-bold">
                    pH {soil.ph}{" "}
                    <span className="text-[11px] font-normal text-slate-500">
                      ({soil.ph < 6.8 ? "Slab acid" : soil.ph <= 7.4 ? "Neutru optim" : "Alcalin/Carbonatic"})
                    </span>
                  </span>
                </div>
                {/* pH gradient track with indicator needle */}
                <div className="relative w-full h-2.5 rounded-full bg-gradient-to-r from-orange-400 via-emerald-400 to-blue-500">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full shadow-md transition-all duration-500"
                    style={{ left: `${phPercent}%` }}
                    title={`pH: ${soil.ph}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Acid (5.5)</span>
                  <span>Neutru (7.0)</span>
                  <span>Alcalin (8.5)</span>
                </div>
              </div>

              {/* 3. 2-Box Summary for Humus & Erosion */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block font-medium">Conținut de Humus</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-slate-900">{soil.humus_pct}%</span>
                    <span className="text-[10px] text-slate-500">
                      ({soil.humus_pct >= 4.0 ? "Bogat" : "Moderat humifer"})
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block font-medium">Grad de Eroziune</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-extrabold capitalize text-slate-900">{soil.erosion_grade}</span>
                    <span className="text-[10px] text-slate-500">
                      {soil.erosion_grade === "slab" ? "(Pante sub 2°)" : "(Risc spălare pante)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Catalog Soluri Button */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              onClick={() => setIsCatalogOpen(!isCatalogOpen)}
              className="w-full text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isCatalogOpen ? "Ascunde Catalogul Solurilor Moldovei" : "Vezi Catalogul Solurilor din Moldova (soluri.gov.md)"}</span>
              {isCatalogOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Climate Telemetry Card (agrodat.md) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Telemetrie Agrometeo
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      agrodat.md
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Senzori climatici și evapotranspirație în timp real
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Stația {climate.nearest_station_id} ({climate.distance_km} km)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 pt-1">
              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Droplets className="w-5 h-5 text-sky-500 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Umiditate Sol</span>
                  <span className="text-sm font-bold text-slate-900">{climate.soil_moisture_pct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Gauge className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Umiditate Frunză</span>
                  <span className="text-sm font-bold text-slate-900">{climate.leaf_wetness_hours} h (24h)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Wind className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Precipitații 30z</span>
                  <span className="text-sm font-bold text-slate-900">{climate.precipitation_last_30d_mm} mm</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Thermometer className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Evapotranspirație ETo</span>
                  <span className="text-sm font-bold text-slate-900">{climate.eto_evapotranspiration_mm} mm/zi</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-sky-50/50 p-3 rounded-xl border border-sky-100 leading-relaxed">
              💡 <strong>Impact Hidric:</strong> La o evapotranspirație de {climate.eto_evapotranspiration_mm} mm/zi, solul pierde zilnic până la {Math.round(climate.eto_evapotranspiration_mm * 10)} tone de apă per hectar.
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Moldova Soil Catalog (soluri.gov.md) */}
      {isCatalogOpen && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                Catalogul Pedologic Național (soluri.gov.md &bull; Institutul „Nicolae Dimo”)
              </h4>
              <p className="text-xs text-slate-500">
                Clasificarea celor 6 profiluri pedologice reprezentative din Republica Moldova
              </p>
            </div>
            <button
              onClick={() => setIsCatalogOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Închide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOLDOVA_SOIL_CATALOG.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h5 className="font-bold text-xs text-slate-900">{item.type}</h5>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 whitespace-nowrap">
                      {item.bonitate} pct.
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">{item.region}</span>
                  <p className="text-[11px] text-slate-600 leading-snug mb-3">{item.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Humus &amp; pH:</span>
                    <span className="font-semibold text-slate-800">{item.humus} &bull; {item.ph}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Culturi optime:</span>
                    <span className="font-bold text-emerald-700 text-right">{item.bestCrops}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Agronomic Synthesis Banner */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 rounded-2xl border border-emerald-200 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-2.5 flex-1">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Sinteza Asistentului Agronomic AI (Google Gemini &bull; Model Hibrid Determinist)
              </h4>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed font-medium">
                {aiGuidance.summary}
              </p>
            </div>

            {/* Actionable Steps & Risks */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {aiGuidance.risks.map((risk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 border border-amber-200 font-medium"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{risk}</span>
                  </span>
                ))}
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60 space-y-1.5 text-xs text-slate-700">
                <span className="font-bold text-emerald-900 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Măsuri agrotehnice recomandate pentru acest profil de sol:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {aiGuidance.actionable_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
