"use client";

import React from "react";
import { SoilProfile, ClimateTelemetry, AIGuidance } from "@/lib/types";
import { Layers, CloudSun, AlertTriangle, CheckCircle2, Droplets, Thermometer, Wind, Gauge } from "lucide-react";

interface ParcelInfoCardProps {
  soil: SoilProfile;
  climate: ClimateTelemetry;
  aiGuidance: AIGuidance;
}

export const ParcelInfoCard: React.FC<ParcelInfoCardProps> = ({
  soil,
  climate,
  aiGuidance,
}) => {
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
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
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
          </div>
        </div>
      </div>

      {/* AI Agronomic Synthesis Banner */}
      <div className="rounded-[22px] border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-900">
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
          </div>
        </div>
      </div>
    </div>
  );
};
