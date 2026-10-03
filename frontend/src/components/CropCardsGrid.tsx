"use client";

import React, { useState } from "react";
import { RecommendedCrop } from "@/lib/types";
import { TrendingUp, Coins, ChevronDown, ChevronUp, Check, Award, Sprout } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Ierarhia Culturilor Recomandate
          </h3>
          <p className="text-xs text-slate-500">
            Calcul determinist: bonitate pedologică &times; regim hidric &times; deviz cheltuieli MDL/ha
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {crops.length} Culturi Analizate
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crops.map((crop, idx) => {
          const isTop = idx === 0;
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={crop.crop_name}
              className={`rounded-2xl border transition-all duration-200 bg-white p-5 flex flex-col justify-between ${
                isTop
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div>
                {/* Header with Rank & Score */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isTop
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        {crop.crop_name}
                        {isTop && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Cea mai rentabilă
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  {/* Suitability Badge */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      {crop.suitability_score}% Potrivire
                    </div>
                  </div>
                </div>

                {/* Suitability Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
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
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100 mb-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Recoltă (t/ha)</span>
                    <span className="text-sm font-bold text-slate-800">
                      {crop.estimated_yield.min_t_ha} - {crop.estimated_yield.max_t_ha}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Investiție</span>
                    <span className="text-sm font-bold text-slate-800">
                      {crop.estimated_costs_mdl_ha.toLocaleString("ro-MD")} MDL
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Profit Net</span>
                    <span className={`text-sm font-extrabold ${
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
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1.5 transition-colors"
                >
                  <span>{isExpanded ? "Ascunde devizul de costuri" : "Vezi devizul complet (MDL/ha)"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && crop.cost_breakdown && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg">
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
