"use client";

import React, { useState } from "react";
import { RecommendedCrop } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  Award,
  Sprout,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Layers,
} from "lucide-react";

interface CropCardsGridProps {
  crops: RecommendedCrop[];
  viewMode?: "per_ha" | "total";
  areaHa?: number;
  onToggleViewMode?: (mode: "per_ha" | "total") => void;
}

const CROP_FALLBACK_PRICES: Record<string, number> = {
  "Rapita": 9200,
  "Soia": 8900,
  "Floarea-soarelui": 7800,
  "Grau de toamna": 3800,
  "Orz de toamna": 3500,
  "Porumb": 3400,
};

export const CropCardsGrid: React.FC<CropCardsGridProps> = ({
  crops,
  viewMode = "per_ha",
  areaHa = 0,
  onToggleViewMode,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"suitability" | "profit">("suitability");

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleSortChange = (mode: "suitability" | "profit") => {
    setSortBy(mode);
    setExpandedIndex(null);
  };

  const sortedCrops = [...crops].sort((a, b) =>
    sortBy === "profit"
      ? b.net_profit_mdl_ha - a.net_profit_mdl_ha
      : b.suitability_score - a.suitability_score ||
        b.net_profit_mdl_ha - a.net_profit_mdl_ha
  );

  const isTotal = viewMode === "total" && areaHa > 0;
  const multiplier = isTotal ? areaHa : 1;

  return (
    <div className="space-y-4">
      {/* Header cu Titlu și Comutator Per Hectar / Total Parcelă */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
            Recomandări pentru parcelă
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Comparație agronomică și rentabilitate financiară transparentă.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Comutator sortare */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold shadow-2xs">
            <span className="px-2 text-[10px] uppercase tracking-wide text-slate-400">Sortează</span>
            <button
              onClick={() => handleSortChange("suitability")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                sortBy === "suitability"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Potrivire
            </button>
            <button
              onClick={() => handleSortChange("profit")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                sortBy === "profit"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Profit
            </button>
          </div>

          {/* Comutator mod afișare */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold shadow-2xs">
            <button
              onClick={() => onToggleViewMode && onToggleViewMode("per_ha")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === "per_ha"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Per hectar (1 ha)
            </button>
            <button
              onClick={() => onToggleViewMode && onToggleViewMode("total")}
              disabled={areaHa <= 0}
              title={
                areaHa <= 0
                  ? "Selectează o parcelă pe hartă pentru calculul pe toată suprafața"
                  : `Calculează pe toată suprafața parcelei (${areaHa} ha)`
              }
              className={`rounded-lg px-3 py-1.5 transition-all ${
                isTotal
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {areaHa > 0 ? `Toată parcela (${areaHa} ha)` : "Toată parcela (— ha)"}
            </button>
          </div>

          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 sm:inline">
            {crops.length} culturi analizate
          </span>
        </div>
      </div>

      {/* Grid Cartonașe Culturi */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedCrops.map((crop, idx) => {
          const isTop = idx === 0;
          const isExpanded = expandedIndex === idx;

          // Determinare preț de piață
          const avgYield = (crop.estimated_yield.min_t_ha + crop.estimated_yield.max_t_ha) / 2;
          const marketPrice =
            crop.market_price_mdl_per_ton ||
            CROP_FALLBACK_PRICES[crop.crop_name] ||
            Math.round(crop.estimated_revenue_mdl_ha / Math.max(0.1, avgYield));

          // Scenarii de venit și profit
          const revenueMin = crop.estimated_yield.min_t_ha * marketPrice;
          const revenueMax = crop.estimated_yield.max_t_ha * marketPrice;
          const revenueAvg = crop.estimated_revenue_mdl_ha;

          const netMin =
            crop.net_profit_min_mdl_ha !== undefined
              ? crop.net_profit_min_mdl_ha
              : revenueMin - crop.estimated_costs_mdl_ha;
          const netMax =
            crop.net_profit_max_mdl_ha !== undefined
              ? crop.net_profit_max_mdl_ha
              : revenueMax - crop.estimated_costs_mdl_ha;
          const netAvg = crop.net_profit_mdl_ha;

          // Prag de rentabilitate (break-even t/ha)
          const breakEven =
            crop.break_even_yield_t_ha ||
            Number((crop.estimated_costs_mdl_ha / Math.max(1, marketPrice)).toFixed(2));

          return (
            <div
              key={crop.crop_name}
              className={`flex flex-col justify-between rounded-[22px] border p-5 transition-all duration-200 ${
                isTop
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50/70 via-white to-white shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-200"
                  : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              }`}
            >
              <div>
                {/* Header cu Rang, Titlu și Preț de Piață */}
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
                        <Sprout
                          className={`h-4 w-4 shrink-0 ${isTop ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        {crop.crop_name}
                      </h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          Preț piață: {marketPrice.toLocaleString("ro-MD")} MDL/t
                        </span>
                        {isTop && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            <Award className="h-3 w-3" />{" "}
                            {sortBy === "profit" ? "Cel mai mare profit" : "Cea mai potrivită"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scor Pretabilitate */}
                  <div className="text-right shrink-0">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      {crop.suitability_score}% Potrivire
                    </div>
                  </div>
                </div>

                {/* Bară Progres Potrivire */}
                <div className="mb-4 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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

                {/* 3 Metric Badges (cu suport Per Hectar vs Total Parcelă) */}
                <div className="mb-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {isTotal ? `Recoltă (${areaHa} ha)` : "Recoltă (t/ha)"}
                    </span>
                    <span className="mt-1 block text-sm font-extrabold text-slate-800">
                      {isTotal
                        ? `${(crop.estimated_yield.min_t_ha * multiplier).toFixed(0)} - ${(
                            crop.estimated_yield.max_t_ha * multiplier
                          ).toFixed(0)} t`
                        : `${crop.estimated_yield.min_t_ha} - ${crop.estimated_yield.max_t_ha}`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {isTotal ? "Investiție totală" : "Investiție / ha"}
                    </span>
                    <span className="mt-1 block text-sm font-extrabold text-slate-800">
                      {Math.round(crop.estimated_costs_mdl_ha * multiplier).toLocaleString("ro-MD")}{" "}
                      <span className="text-[10px] font-medium text-slate-400">MDL</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {isTotal ? "Profit net total" : "Profit net / ha"}
                    </span>
                    <span
                      className={`mt-1 block text-sm font-extrabold ${
                        netAvg >= 0 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {Math.round(netAvg * multiplier).toLocaleString("ro-MD")}{" "}
                      <span className="text-[10px] font-medium opacity-75">MDL</span>
                    </span>
                  </div>
                </div>

                {/* Scenarii de Recoltă & Profit (Min / Mediu / Optim) */}
                <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Interval scenarii profit</span>
                    <span className="text-slate-400">
                      Prag acoperire cost: <strong>{breakEven} t/ha</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="rounded-lg border border-slate-200/80 bg-white p-1.5 shadow-2xs">
                      <span className="block font-bold text-amber-700">Secetos (min)</span>
                      <span className="block text-slate-400 text-[9px]">
                        {crop.estimated_yield.min_t_ha} t/ha
                      </span>
                      <span
                        className={`mt-0.5 block font-extrabold ${
                          netMin >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {netMin >= 0 ? "+" : ""}
                        {Math.round(netMin * multiplier).toLocaleString("ro-MD")} L
                      </span>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-1.5 shadow-2xs">
                      <span className="block font-bold text-emerald-800">Mediu (bază)</span>
                      <span className="block text-emerald-600 text-[9px]">
                        {avgYield.toFixed(2)} t/ha
                      </span>
                      <span className="mt-0.5 block font-extrabold text-emerald-700">
                        +{Math.round(netAvg * multiplier).toLocaleString("ro-MD")} L
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-200/80 bg-white p-1.5 shadow-2xs">
                      <span className="block font-bold text-blue-700">Optim (max)</span>
                      <span className="block text-slate-400 text-[9px]">
                        {crop.estimated_yield.max_t_ha} t/ha
                      </span>
                      <span className="mt-0.5 block font-extrabold text-emerald-700">
                        +{Math.round(netMax * multiplier).toLocaleString("ro-MD")} L
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deviz Detaliat & Transparență Calcul */}
              <div>
                <button
                  onClick={() => toggleExpand(idx)}
                  className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-700"
                >
                  <span>
                    {isExpanded
                      ? "Ascunde devizul de costuri"
                      : `Vezi devizul complet & formula (${isTotal ? `${areaHa} ha` : "MDL/ha"})`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExpanded && crop.cost_breakdown && (
                  <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      <span>Deviz cheltuieli {isTotal ? `(${areaHa} ha)` : "(1 ha)"}</span>
                      <span>Preț: {marketPrice.toLocaleString("ro-MD")} MDL/t</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Semințe certificate:</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(
                          (crop.cost_breakdown.seeds_mdl || 0) * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Îngrășăminte NPK:</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(
                          (crop.cost_breakdown.fertilizers_mdl || 0) * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Motorină &amp; Carburanți:</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(
                          (crop.cost_breakdown.fuel_diesel_mdl || 0) * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesticide &amp; Tratamente:</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(
                          (crop.cost_breakdown.pesticides_mdl || 0) * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucrări mecanizate:</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(
                          (crop.cost_breakdown.mechanized_labor_mdl || 0) * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                      <span>Total Investiție (Cheltuieli):</span>
                      <span>
                        {Math.round(
                          crop.estimated_costs_mdl_ha * multiplier
                        ).toLocaleString("ro-MD")}{" "}
                        MDL
                      </span>
                    </div>

                    {/* Bloc Explicativ Transparență Finanțe */}
                    <div className="mt-2.5 rounded-lg border border-emerald-200/90 bg-emerald-50/80 p-2.5 text-[11px] text-emerald-950 space-y-1">
                      <p className="font-extrabold text-emerald-900 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        Cum este calculat profitul:
                      </p>
                      <p className="leading-relaxed">
                        • <strong>Venit brut:</strong> {avgYield.toFixed(2)} t/ha ×{" "}
                        {marketPrice.toLocaleString("ro-MD")} MDL/t{" "}
                        {isTotal ? `× ${areaHa} ha ` : ""}=&nbsp;
                        <strong>
                          {Math.round(revenueAvg * multiplier).toLocaleString("ro-MD")} MDL
                        </strong>
                      </p>
                      <p className="leading-relaxed">
                        • <strong>Profit net:</strong> {Math.round(revenueAvg * multiplier).toLocaleString("ro-MD")} MDL (Venit) −{" "}
                        {Math.round(crop.estimated_costs_mdl_ha * multiplier).toLocaleString("ro-MD")} MDL (Cost) =&nbsp;
                        <strong className="text-emerald-700">
                          +{Math.round(netAvg * multiplier).toLocaleString("ro-MD")} MDL
                        </strong>
                      </p>
                      <p className="leading-relaxed text-slate-600 text-[10px] pt-0.5 border-t border-emerald-200/60">
                        * Prag rentabilitate: ai nevoie de minim <strong>{breakEven} t/ha</strong> pentru a acoperi cheltuielile de producție.
                      </p>
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
