"use client";

import React from "react";
import { RecommendedCrop } from "@/lib/types";

interface FinancialChartProps {
  crops: RecommendedCrop[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ crops }) => {
  const maxRevenue = Math.max(...crops.map((c) => c.estimated_revenue_mdl_ha), 25000);

  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            Investiție vs. profit net
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Comparație transparentă pe hectar, în MDL.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-slate-300" />
            <span className="text-slate-600">Investiție (Cost)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
            <span className="text-slate-600">Profit Net</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {crops.map((crop) => {
          const costPct = (crop.estimated_costs_mdl_ha / maxRevenue) * 100;
          const profitPct = (Math.max(0, crop.net_profit_mdl_ha) / maxRevenue) * 100;

          return (
            <div key={crop.crop_name} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="font-bold text-slate-800">{crop.crop_name}</span>
                <span className="whitespace-nowrap font-extrabold text-emerald-700">
                  +{crop.net_profit_mdl_ha.toLocaleString("ro-MD")} MDL/ha net
                </span>
              </div>

              {/* Stacked comparison bar */}
              <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="bg-slate-300 h-full flex items-center justify-end pr-1.5 text-[10px] text-slate-700 font-bold"
                  style={{ width: `${costPct}%` }}
                  title={`Cost: ${crop.estimated_costs_mdl_ha} MDL`}
                >
                  {costPct > 20 && `${Math.round(crop.estimated_costs_mdl_ha / 1000)}k`}
                </div>
                <div
                  className="bg-emerald-500 h-full flex items-center justify-end pr-1.5 text-[10px] text-white font-bold"
                  style={{ width: `${profitPct}%` }}
                  title={`Profit: ${crop.net_profit_mdl_ha} MDL`}
                >
                  {profitPct > 15 && `+${Math.round(crop.net_profit_mdl_ha / 1000)}k`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
