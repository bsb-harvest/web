"use client";

import React, { useState } from "react";
import { RecommendedCrop } from "@/lib/types";
import { ChevronDown, ChevronUp, Award, Sprout } from "lucide-react";

interface CropCardsGridProps {
  crops: RecommendedCrop[];
}

export const CropCardsGrid: React.FC<CropCardsGridProps> = ({ crops }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
            Recomandări pentru parcelă
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Scorurile combină bonitatea, regimul hidric și marja estimată în MDL/ha.
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {crops.length} culturi analizate
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {crops.map((crop, idx) => {
          const isTop = idx === 0;
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={crop.crop_name}
              className={`flex flex-col justify-between rounded-[22px] border p-5 transition-all duration-200 ${
                isTop
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50/80 via-white to-white shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-200"
                  : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              }`}
            >
              <div>
                {/* Header with Rank & Score */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs ${
                        isTop
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="flex items-center gap-1.5 truncate text-base font-extrabold text-slate-950">
                        <Sprout className={`h-4 w-4 shrink-0 ${isTop ? "text-emerald-600" : "text-slate-400"}`} />
                        {crop.crop_name}
                      </h4>
                      {isTop && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700"><Award className="h-3 w-3" /> Cea mai bună marjă</span>}
                    </div>
                  </div>

                  {/* Suitability Badge */}
                  <div className="text-right">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      {crop.suitability_score}% Potrivire
                    </div>
                  </div>
                </div>

                {/* Suitability Progress Bar */}
                <div className="mb-5 mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      crop.suitability_score >= 85
                        ? "bg-emerald-500"
                        : crop.suitability_score >= 75
                        ? "bg-teal-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${crop.suitability_score}%` }}
                  />
                </div>

                {/* 3 Metric Badges */}
                <div className="mb-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Recoltă (t/ha)</span>
                    <span className="mt-1 block text-sm font-extrabold text-slate-800">
                      {crop.estimated_yield.min_t_ha} - {crop.estimated_yield.max_t_ha}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Investiție</span>
                    <span className="mt-1 block text-sm font-extrabold text-slate-800">
                      {crop.estimated_costs_mdl_ha.toLocaleString("ro-MD")} MDL
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Profit net</span>
                    <span className={`mt-1 block text-sm font-extrabold ${
                      crop.net_profit_mdl_ha > 0 ? "text-emerald-700" : "text-rose-600"
                    }`}>
                      {crop.net_profit_mdl_ha.toLocaleString("ro-MD")} MDL
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Cost Breakdown Collapsible */}
              <div>
                <button
                  onClick={() => toggleExpand(idx)}
                  className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-700"
                >
                  <span>{isExpanded ? "Ascunde devizul de costuri" : "Vezi devizul complet (MDL/ha)"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && crop.cost_breakdown && (
                  <div className="mt-2 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 pt-3 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Semințe certificate:</span>
                      <span className="font-semibold">{crop.cost_breakdown.seeds_mdl?.toLocaleString()} MDL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Îngrășăminte NPK:</span>
                      <span className="font-semibold">{crop.cost_breakdown.fertilizers_mdl?.toLocaleString()} MDL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Motorină &amp; Carburanți:</span>
                      <span className="font-semibold">{crop.cost_breakdown.fuel_diesel_mdl?.toLocaleString()} MDL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesticide &amp; Tratamente:</span>
                      <span className="font-semibold">{crop.cost_breakdown.pesticides_mdl?.toLocaleString()} MDL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucrări mecanizate:</span>
                      <span className="font-semibold">{crop.cost_breakdown.mechanized_labor_mdl?.toLocaleString()} MDL</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                      <span>Venit Brut Estimat:</span>
                      <span>{crop.estimated_revenue_mdl_ha.toLocaleString()} MDL/ha</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
