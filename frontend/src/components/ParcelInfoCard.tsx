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
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from "lucide-react";

interface ParcelInfoCardProps {
  soil: SoilProfile;
  climate: ClimateTelemetry;
  aiGuidance: AIGuidance;
}

// Baza de date cu profilurile solurilor din Moldova (soluri.gov.md & Institutul de Pedologie „Nicolae Dimo”)
const MOLDOVA_SOIL_CATALOG = [
  {
    type: "Cernoziom levigat și tipic lutos",
    region: "Nord (Bălți, Edineț, Soroca)",
    bonitate: 84,
    humus: "4.0 - 4.5%",
    ph: "6.6 - 7.0 (Neutru)",
    description: "Cele mai fertile soluri din Moldova, cu textură lutoasă și capacitate excepțională de reținere a apei.",
    bestCrops: "Grâu, Sfeclă de zahăr, Soia, Rapiță",
  },
  {
    type: "Cernoziom tipic moderat humifer",
    region: "Centru (Chișinău, Orhei, Strășeni)",
    bonitate: 76,
    humus: "3.5 - 4.0%",
    ph: "7.0 - 7.4 (Slab alcalin)",
    description: "Sol echilibrat agrotehnic, profil profund, favorabil majorității culturilor de câmp și livezilor.",
    bestCrops: "Floarea-soarelui, Grâu de toamnă, Porumb",
  },
  {
    type: "Cernoziom carbonatic și xerofitic de stepă",
    region: "Sud (Cahul, Comrat, Taraclia)",
    bonitate: 68,
    humus: "2.8 - 3.4%",
    ph: "7.6 - 8.2 (Alcalin/Carbonatic)",
    description: "Format în condiții de deficit de precipitații; bogat în carbonați de calciu liber, sensibil la secetă.",
    bestCrops: "Floarea-soarelui, Sorg, Viță-de-vie, Orz",
  },
  {
    type: "Sol cenușiu de pădure (Codru)",
    region: "Podișul Central al Codrilor",
    bonitate: 62,
    humus: "2.2 - 3.0%",
    ph: "5.8 - 6.5 (Slab acid)",
    description: "Structură luto-nisipoasă, susceptibil la compactare și eroziune hidrică de versant.",
    bestCrops: "Livezi (măr, prun), Viță-de-vie, Porumb",
  },
  {
    type: "Sol aluvial de luncă (Prut și Nistru)",
    region: "Văile râurilor Prut și Nistru",
    bonitate: 78,
    humus: "3.0 - 4.2%",
    ph: "7.1 - 7.8 (Neutru-Slab alcalin)",
    description: "Nivel freatic accesibil, textură stratificată, ideal pentru irigare și legumicultură intensivă.",
    bestCrops: "Porumb boabe, Legume de câmp, Soia",
  },
  {
    type: "Cernoziom vertic / argilos",
    region: "Bazinul Răutului și Depresiuni",
    bonitate: 70,
    humus: "3.2 - 3.8%",
    ph: "7.0 - 7.5 (Neutru)",
    description: "Conținut ridicat de argilă montmorillonitică; se contractă puternic la secetă formând crăpături adânci.",
    bestCrops: "Grâu, Floarea-soarelui, Ierburi furajere",
  },
];

function getBonitateBadge(points: number) {
  if (points >= 80) return { label: "Clasa I • Foarte fertil", color: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (points >= 70) return { label: "Clasa II • Fertilitate ridicată", color: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (points >= 60) return { label: "Clasa III • Fertilitate medie", color: "border-amber-200 bg-amber-50 text-amber-800" };
  return { label: "Clasa IV-V • Degradat / Deficit hidric", color: "border-rose-200 bg-rose-50 text-rose-800" };
}

export const ParcelInfoCard: React.FC<ParcelInfoCardProps> = ({
  soil,
  climate,
  aiGuidance,
}) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const bonitateInfo = getBonitateBadge(soil.bonitate_points);

  return (
    <div className="space-y-4">
      {/* 2-Column Grid for Soil and Meteo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Soil Profile Card (soluri.gov.md) */}
        <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-950">Profil pedologic</h3>
                  <span className="text-[11px] text-slate-500 font-medium">Sursa: soluri.gov.md</span>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${bonitateInfo.color}`}>
                Bonitate: {soil.bonitate_points} pct
              </span>
            </div>

            <p className="mb-4 text-sm font-bold text-slate-800">
              {soil.type}
            </p>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
              <div className="rounded-xl bg-slate-50 p-2">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Humus</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800">{soil.humus_pct}%</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">pH sol</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800">{soil.ph}</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Eroziune</span>
                <span className="mt-1 block text-sm font-extrabold capitalize text-slate-800">{soil.erosion_grade}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1 text-xs">
              <span className="font-semibold text-slate-500">{bonitateInfo.label}</span>
              <button
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isCatalogOpen ? "Ascunde catalog" : "Catalog pedologic"}</span>
                {isCatalogOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Climate Telemetry Card (agrodat.md) */}
        <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <CloudSun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-950">Telemetrie agrometeo</h3>
                  <span className="text-[11px] text-slate-500 font-medium">Sursa: agrodat.md</span>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                Stația {climate.nearest_station_id} ({climate.distance_km} km)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Umiditate Sol</span>
                  <span className="text-sm font-bold text-slate-900">{climate.soil_moisture_pct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Umiditate Frunză</span>
                  <span className="text-sm font-bold text-slate-900">{climate.leaf_wetness_hours} h (24h)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-indigo-500" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Precipitații 30z</span>
                  <span className="text-sm font-bold text-slate-900">{climate.precipitation_last_30d_mm} mm</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Evapotranspirație ETo</span>
                  <span className="text-sm font-bold text-slate-900">{climate.eto_evapotranspiration_mm} mm/zi</span>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-xl bg-sky-50/70 p-2.5 text-[11px] text-slate-600 border border-sky-100/80">
              💡 <strong>Impact hidric:</strong> Evapotranspirație de {climate.eto_evapotranspiration_mm} mm/zi (~{Math.round(climate.eto_evapotranspiration_mm * 10)} t apă/ha pierdere zilnică).
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Moldova Soil Catalog (soluri.gov.md) */}
      {isCatalogOpen && (
        <div className="rounded-[22px] border border-amber-200/90 bg-white p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                Catalogul Pedologic Național (soluri.gov.md &bull; Institutul „Nicolae Dimo”)
              </h4>
              <p className="text-xs text-slate-500">
                Cele 6 profile pedologice de referință din Republica Moldova și pretabilitatea culturilor
              </p>
            </div>
            <button
              onClick={() => setIsCatalogOpen(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Închide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOLDOVA_SOIL_CATALOG.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/70 hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h5 className="font-bold text-xs text-slate-900">{item.type}</h5>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 whitespace-nowrap">
                      {item.bonitate} pct
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">{item.region}</span>
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
      <div className="rounded-[22px] border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-2.5 flex-1">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Recomandarea asistentului AI
              </h4>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                {aiGuidance.summary}
              </p>
            </div>

            {/* Risks & Actions badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {aiGuidance.risks.map((risk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>{risk}</span>
                </span>
              ))}
            </div>

            {aiGuidance.actionable_steps && aiGuidance.actionable_steps.length > 0 && (
              <div className="mt-2 rounded-xl bg-white/80 p-3 border border-emerald-200/60 text-xs text-slate-700">
                <span className="font-bold text-emerald-900 block mb-1">
                  Măsuri agrotehnice recomandate:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {aiGuidance.actionable_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
