"use client";

import React from "react";
import { RecommendedCrop } from "@/lib/types";

interface FinancialChartProps {
  crops: RecommendedCrop[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ crops }) => {
  const maxRevenue = Math.max(...crops.map((c) => c.estimated_revenue_mdl_ha), 25000);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Comparație Financiară: Investiție vs. Profit Net (MDL/ha)
          </h3>
          <p className="text-xs text-slate-500">
            Raportul dintre cheltuielile totale de înființare a culturii și marja netă de profit
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" />
            <span className="text-slate-600">Investiție (Cost)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-slate-600">Profit Net</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {crops.map((crop) => {
          const costPct = (crop.estimated_costs_mdl_ha / maxRevenue) * 100;
          const profitPct = (Math.max(0, crop.net_profit_mdl_ha) / maxRevenue) * 100;

          return (
            <div key={crop.crop_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{crop.crop_name}</span>
                <span className="text-emerald-700 font-bold">
                  +{crop.net_profit_mdl_ha.toLocaleString("ro-MD")} MDL/ha net
                </span>
              </div>

              {/* Stacked comparison bar */}
              <div className="w-full h-5 bg-slate-100 rounded-md overflow-hidden flex">
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
