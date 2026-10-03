"use client";

import React from "react";
import { RecommendedCrop } from "@/lib/types";

interface FinancialChartProps {
  crops: RecommendedCrop[];
  viewMode?: "per_ha" | "total";
  areaHa?: number;
  onToggleViewMode?: (mode: "per_ha" | "total") => void;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  crops,
  viewMode = "per_ha",
  areaHa = 0,
  onToggleViewMode,
}) => {
  const isTotal = viewMode === "total" && areaHa > 0;
  const multiplier = isTotal ? areaHa : 1;

  const maxRevenue = Math.max(
    ...crops.map((c) => c.estimated_revenue_mdl_ha * multiplier),
    25000 * multiplier
  );

  const formatShortValue = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `${Math.round(val / 1_000)}k`;
    }
    return `${Math.round(val)}`;
  };

  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            Investiție vs. profit net
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {isTotal
              ? `Comparație economică pe toată suprafața parcelei (${areaHa} ha), în MDL.`
              : "Comparație economică pe hectar (1 ha), în MDL."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          {/* Legendă */}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-slate-300" />
            <span className="text-slate-600">Investiție (Cost)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
            <span className="text-slate-600">Profit Net</span>
          </div>

          {/* Comutator Per Hectar / Total */}
          {onToggleViewMode && (
            <div className="ml-2 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-[11px] font-bold">
              <button
                onClick={() => onToggleViewMode("per_ha")}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewMode === "per_ha"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                1 ha
              </button>
              <button
                onClick={() => onToggleViewMode("total")}
                disabled={areaHa <= 0}
                title={
                  areaHa <= 0
                    ? "Selectează o parcelă pe hartă pentru a calcula pe toată suprafața"
                    : `Calculează pe toată suprafața (${areaHa} ha)`
                }
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  isTotal
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {areaHa > 0 ? `Toată parcela (${areaHa} ha)` : "Toată parcela"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {crops.map((crop) => {
          const scaledCost = crop.estimated_costs_mdl_ha * multiplier;
          const scaledProfit = crop.net_profit_mdl_ha * multiplier;

          const costPct = (scaledCost / maxRevenue) * 100;
          const profitPct = (Math.max(0, scaledProfit) / maxRevenue) * 100;

          return (
            <div key={crop.crop_name} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="font-bold text-slate-800">{crop.crop_name}</span>
                <span className="whitespace-nowrap font-extrabold text-emerald-700">
                  +{Math.round(scaledProfit).toLocaleString("ro-MD")} MDL
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    {isTotal ? `(total ${areaHa} ha)` : "/ ha"}
                  </span>
                </span>
              </div>

              {/* Stacked comparison bar */}
              <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="bg-slate-300 h-full flex items-center justify-end pr-1.5 text-[10px] text-slate-700 font-bold"
                  style={{ width: `${costPct}%` }}
                  title={`Cost: ${Math.round(scaledCost).toLocaleString("ro-MD")} MDL`}
                >
                  {costPct > 15 && formatShortValue(scaledCost)}
                </div>
                <div
                  className="bg-emerald-500 h-full flex items-center justify-end pr-1.5 text-[10px] text-white font-bold"
                  style={{ width: `${profitPct}%` }}
                  title={`Profit: ${Math.round(scaledProfit).toLocaleString("ro-MD")} MDL`}
                >
                  {profitPct > 15 && `+${formatShortValue(scaledProfit)}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
