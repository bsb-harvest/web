"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ParcelMap } from "@/components/ParcelMap";
import { ParcelInfoCard } from "@/components/ParcelInfoCard";
import { CropCardsGrid } from "@/components/CropCardsGrid";
import { FinancialChart } from "@/components/FinancialChart";
import { AIChatPanel } from "@/components/AIChatPanel";
import { ReportModal } from "@/components/ReportModal";
import { DEFAULT_PARCEL_DATA } from "@/mock/defaultParcelData";
import { ParcelAnalysisResponse } from "@/lib/types";
import { analyzeParcel } from "@/lib/api";
import { Sparkles, Info, RefreshCw } from "lucide-react";

export default function Home() {
  const [analysis, setAnalysis] = useState<ParcelAnalysisResponse>(DEFAULT_PARCEL_DATA);
  const [isMock, setIsMock] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<number[][]>(DEFAULT_PARCEL_DATA.coordinates);

  // Verificare inițială la pornire
  useEffect(() => {
    handleRunAnalysis();
  }, []);

  const handleRunAnalysis = async (cadastralCode?: string, overrideCoords?: number[][]) => {
    setIsAnalyzing(true);
    const coordsToSend = overrideCoords || currentCoords;
    try {
      const result = await analyzeParcel({
        cadastral_code: cadastralCode || analysis.cadastral_code || undefined,
        coordinates: coordsToSend,
      });
      setAnalysis(result.data);
      if (result.data.coordinates && result.data.coordinates.length >= 3) {
        setCurrentCoords(result.data.coordinates);
      }
      setIsMock(result.isMock);
    } catch (err) {
      console.error("Eroare la rularea analizei:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePolygonChange = (newCoords: number[][]) => {
    setCurrentCoords(newCoords);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        isMock={isMock}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Informational Top */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ghid Decizional Agronomic &bull; Arhitectură Hibridă Zero-Blocking
              </h2>
              <p className="text-xs text-slate-500">
                Desenați sau alegeți o parcelă pentru calculul determinist al profitabilității și asistență agrotehnică AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span>Reîmprospătează datele</span>
            </button>
          </div>
        </div>

        {/* Top Section: Interactive Map */}
        <section>
          <ParcelMap
            coordinates={currentCoords}
            areaHa={analysis.area_ha}
            cadastralCode={analysis.cadastral_code}
            onPolygonChange={handlePolygonChange}
            onAnalyze={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
          />
        </section>

        {/* Middle Section: Soil Profile + Meteo Telemetry + AI Guidance */}
        <section>
          <ParcelInfoCard
            soil={analysis.soil_profile}
            climate={analysis.climate_telemetry}
            aiGuidance={analysis.ai_guidance}
          />
        </section>

        {/* Lower Section: Crop Recommendations Grid */}
        <section>
          <CropCardsGrid crops={analysis.recommended_crops} />
        </section>

        {/* Financial Comparison Chart */}
        <section>
          <FinancialChart crops={analysis.recommended_crops} />
        </section>
      </main>

      {/* Floating AI Chat Assistant Drawer */}
      <AIChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        analysis={analysis}
      />

      {/* Printable Executive Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysis={analysis}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            AgriTech AI Guidance Moldova &bull; Octombrie 2026
          </p>
          <p>
            Dezvoltat cu FastAPI, PostgreSQL/PostGIS, Next.js, agrodat.md, soluri.gov.md și Google Gemini API.
          </p>
        </div>
      </footer>
    </div>
  );
}
