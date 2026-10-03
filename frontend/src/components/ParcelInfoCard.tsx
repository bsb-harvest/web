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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Soil Profile Card (soluri.gov.md) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Profil Pedologic</h3>
                  <span className="text-[11px] text-slate-500 font-medium">Sursa: soluri.gov.md</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Bonitate: {soil.bonitate_points} pct
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 mb-4">
              {soil.type}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Humus</span>
                <span className="text-sm font-bold text-slate-800">{soil.humus_pct}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[11px] text-slate-500 block">pH Sol</span>
                <span className="text-sm font-bold text-slate-800">{soil.ph}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Eroziune</span>
                <span className="text-sm font-bold capitalize text-slate-800">{soil.erosion_grade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Climate Telemetry Card (agrodat.md) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Telemetrie Agrometeo</h3>
                  <span className="text-[11px] text-slate-500 font-medium">Sursa: agrodat.md</span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
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
      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-200/80 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Sinteza Asistentului Agronomic AI (Google Gemini)
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
