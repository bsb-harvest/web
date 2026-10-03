"use client";

import React from "react";
import { X, Printer, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { ParcelAnalysisResponse } from "@/lib/types";

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
              Raport Executiv Agronomic — {analysis.cadastral_code || analysis.parcel_id}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Printează / PDF</span>
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
              🌱 AgriTech AI Guidance Moldova
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fișă Tehnică de Recomandare a Culturilor Agricole &bull; Republica Moldova
            </p>
          </div>

          {/* 3 Box Meta Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">ID Parcelă / Cadastru</span>
              <span className="font-bold text-slate-900">{analysis.cadastral_code || analysis.parcel_id}</span>
              <span className="text-xs text-slate-600 block mt-1">Suprafață: <strong>{analysis.area_ha.toFixed(2)} ha</strong></span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Profil Pedologic</span>
              <span className="font-bold text-slate-900">{analysis.soil_profile.type}</span>
              <span className="text-xs text-emerald-700 font-bold block mt-1">Bonitate: {analysis.soil_profile.bonitate_points} puncte</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Telemetrie Agrometeo</span>
              <span className="font-bold text-slate-900">Umiditate Sol: {analysis.climate_telemetry.soil_moisture_pct}%</span>
              <span className="text-xs text-slate-600 block mt-1">Frunză: {analysis.climate_telemetry.leaf_wetness_hours}h umed</span>
            </div>
          </div>

          {/* AI Guidance Summary */}
          <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-4 rounded-r-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Sinteza Agronomică (Google Gemini)
            </h4>
            <p className="text-xs leading-relaxed text-slate-700">
              {analysis.ai_guidance.summary}
            </p>
          </div>

          {/* Crops Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Matricea de Rentabilitate a Culturilor Candidate
            </h4>
            <table className="w-full text-xs border border-slate-200 text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-2 border-b">Cultură</th>
                  <th className="p-2 border-b text-center">Potrivire</th>
                  <th className="p-2 border-b text-center">Randament (t/ha)</th>
                  <th className="p-2 border-b text-right">Cost (MDL/ha)</th>
                  <th className="p-2 border-b text-right">Venit (MDL/ha)</th>
                  <th className="p-2 border-b text-right">Profit Net (MDL/ha)</th>
                </tr>
              </thead>
              <tbody>
                {analysis.recommended_crops.map((c) => (
                  <tr key={c.crop_name} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{c.crop_name}</td>
                    <td className="p-2 text-center">{c.suitability_score}%</td>
                    <td className="p-2 text-center">{c.estimated_yield.min_t_ha} - {c.estimated_yield.max_t_ha}</td>
                    <td className="p-2 text-right">{c.estimated_costs_mdl_ha.toLocaleString()} MDL</td>
                    <td className="p-2 text-right">{c.estimated_revenue_mdl_ha.toLocaleString()} MDL</td>
                    <td className="p-2 text-right font-extrabold text-emerald-700">+{c.net_profit_mdl_ha.toLocaleString()} MDL</td>
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
                Măsuri Agrotehnice Recomandate
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
                Avertizări Fitosanitare &amp; Climatice
              </h5>
              <ul className="text-xs space-y-1.5 text-slate-600 pl-4 list-disc">
                {analysis.ai_guidance.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
