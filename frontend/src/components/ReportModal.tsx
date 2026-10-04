"use client";

import React from "react";
import { X, Printer, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { ParcelAnalysisResponse } from "@/lib/types";

import { useLanguage } from "@/i18n/LanguageContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ParcelAnalysisResponse;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (Hidden on print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              {t.report.title} — {analysis.cadastral_code || analysis.parcel_id}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{t.report.print}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content (Styled for screen & print) */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          {/* Header Title */}
          <div className="border-b-2 border-emerald-600 pb-3">
            <h1 className="text-xl font-black text-emerald-800">
              {t.report.headerTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.report.headerSub}
            </p>
          </div>

          {/* 3 Box Meta Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">{t.report.parcelId}</span>
              <span className="font-bold text-slate-900">{analysis.cadastral_code || analysis.parcel_id}</span>
              <span className="text-xs text-slate-600 block mt-1">{t.report.surfaceLabel}: <strong>{analysis.area_ha.toFixed(2)} {t.common.hectares}</strong></span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">{t.report.pedologicProfile}</span>
              <span className="font-bold text-slate-900">{analysis.soil_profile.type}</span>
              <span className="text-xs text-emerald-700 font-bold block mt-1">{t.common.bonitate}: {analysis.soil_profile.bonitate_points} {t.report.bonitatePoints}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">{t.report.telemetry}</span>
              <span className="font-bold text-slate-900">{t.context.moisture}: {analysis.climate_telemetry.soil_moisture_pct}%</span>
              <span className="text-xs text-slate-600 block mt-1">{t.parcelCard.leafWetness}: {analysis.climate_telemetry.leaf_wetness_hours}h</span>
            </div>
          </div>

          {/* AI Guidance Summary */}
          <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-4 rounded-r-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
              {t.parcelCard.aiTitle}
            </h4>
            <p className="text-xs leading-relaxed text-slate-700">
              {analysis.ai_guidance.summary}
            </p>
          </div>

          {/* Crops Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t.report.recommendationsTable}
            </h4>
            <table className="w-full text-xs border border-slate-200 text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-2 border-b">{t.report.cropHeader}</th>
                  <th className="p-2 border-b text-center">{t.report.suitabilityHeader}</th>
                  <th className="p-2 border-b text-center">{t.report.yieldHeader}</th>
                  <th className="p-2 border-b text-right">{t.recommendations.estimatedCosts} ({t.common.currency}/{t.common.hectares})</th>
                  <th className="p-2 border-b text-right">{t.recommendations.estimatedRevenue} ({t.common.currency}/{t.common.hectares})</th>
                  <th className="p-2 border-b text-right">{t.report.profitHeader}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.recommended_crops.map((c) => (
                  <tr key={c.crop_name} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{c.crop_name}</td>
                    <td className="p-2 text-center">{c.suitability_score}%</td>
                    <td className="p-2 text-center">{c.estimated_yield.min_t_ha} - {c.estimated_yield.max_t_ha}</td>
                    <td className="p-2 text-right">{c.estimated_costs_mdl_ha.toLocaleString()} {t.common.currency}</td>
                    <td className="p-2 text-right">{c.estimated_revenue_mdl_ha.toLocaleString()} {t.common.currency}</td>
                    <td className="p-2 text-right font-extrabold text-emerald-700">+{c.net_profit_mdl_ha.toLocaleString()} {t.common.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Steps & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h5 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t.parcelCard.actionSteps}
              </h5>
              <ul className="text-xs space-y-1.5 text-slate-600 pl-4 list-disc">
                {analysis.ai_guidance.actionable_steps.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h5 className="font-bold text-xs text-amber-800 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                {t.parcelCard.keyRisks}
              </h5>
              <ul className="text-xs space-y-1.5 text-slate-600 pl-4 list-disc">
                {analysis.ai_guidance.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t.report.signature}</span>
            <span>{new Date().toLocaleDateString(language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "ro-RO")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
