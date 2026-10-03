"use client";

import React, { useEffect, useState } from "react";
import { AIChatPanel } from "@/components/AIChatPanel";
import { CropCardsGrid } from "@/components/CropCardsGrid";
import { FinancialChart } from "@/components/FinancialChart";
import { Navbar } from "@/components/Navbar";
import { ParcelInfoCard } from "@/components/ParcelInfoCard";
import { ParcelMap } from "@/components/ParcelMap";
import { ReportModal } from "@/components/ReportModal";
import { analyzeParcel } from "@/lib/api";
import { ParcelAnalysisResponse } from "@/lib/types";
import { DEFAULT_PARCEL_DATA } from "@/mock/defaultParcelData";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CloudSun,
  Droplets,
  Leaf,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const [analysis, setAnalysis] = useState<ParcelAnalysisResponse>(DEFAULT_PARCEL_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<number[][]>(DEFAULT_PARCEL_DATA.coordinates);

  useEffect(() => {
    if (window.location.hash === "#dashboard") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
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
    } catch (error) {
      console.error("Eroare la rularea analizei:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const bestCrop = analysis.recommended_crops[0];
  const bestProfit = bestCrop?.net_profit_mdl_ha ?? 0;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-[#1F2F24]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="organic-shape absolute -left-28 top-28 h-56 w-72 rotate-[-18deg] bg-emerald-200/10 blur-2xl" />
        <div className="organic-shape absolute -right-24 top-[32rem] h-72 w-80 rotate-[22deg] bg-lime-200/10 blur-3xl" />
      </div>
      <Navbar
        onOpenChat={() => setIsChatOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      <main className="page-content relative z-10 mx-auto w-full max-w-[1480px] space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section id="dashboard" className="hero-section scroll-mt-28 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="relative max-w-3xl">
            <div aria-hidden="true" className="field-lines pointer-events-none absolute -left-10 top-[-7rem] h-72 w-[34rem] opacity-[0.13]" />
            <div className="hero-badge mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.17em] text-emerald-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Ghid agronomic inteligent
            </div>
            <h1 className="hero-heading relative max-w-3xl text-4xl font-extrabold tracking-[-0.055em] text-[#17211B] sm:text-5xl lg:text-[58px] lg:leading-[1.02]">
              Transformă datele parcelei în decizii agricole mai bune.
            </h1>
            <p className="hero-copy relative mt-5 max-w-2xl text-base leading-7 text-[#647067] sm:text-lg">
              Selectează o parcelă, analizează solul și descoperă culturile recomandate pentru un sezon mai predictibil și mai profitabil.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleRunAnalysis()}
                disabled={isAnalyzing}
                className="hero-action inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Sparkles className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Se analizează..." : "Începe analiza"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="summary-card relative hidden min-w-[340px] rounded-3xl border border-[#DDE7DF] bg-white/90 p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur lg:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><Leaf className="h-5 w-5" /></div>
                Rezumat parcelă
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Live</span>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Bonitate</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{analysis.soil_profile.bonitate_points}<span className="text-base text-slate-400">/100</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Profit top</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">{bestProfit.toLocaleString("ro-MD")}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>{bestCrop?.crop_name || "Alege o cultură"} este recomandarea curentă</span>
            </div>
          </div>
        </section>

        <section id="map" className="page-section scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">01 / Localizare</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#17211B]">Harta parcelei</h2>
              <p className="mt-1 text-sm text-[#647067]">Caută un număr cadastral, selectează direct pe hartă sau desenează conturul parcelei.</p>
            </div>
            <button
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              Actualizează datele
            </button>
          </div>
          <ParcelMap
            coordinates={currentCoords}
            areaHa={analysis.area_ha}
            cadastralCode={analysis.cadastral_code}
            soilBonitate={analysis.soil_profile.bonitate_points}
            soilType={analysis.soil_profile.type}
            onPolygonChange={setCurrentCoords}
            onAnalyze={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
          />
        </section>

        <section id="analysis" className="page-section scroll-mt-24 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard icon={Leaf} label="Bonitate sol" value={`${analysis.soil_profile.bonitate_points}/100`} detail={analysis.soil_profile.type} tone="green" />
          <MetricCard icon={Droplets} label="Umiditate" value={`${analysis.climate_telemetry.soil_moisture_pct}%`} detail="Rezervă utilă de apă" tone="blue" />
          <MetricCard icon={CloudSun} label="Telemetrie meteo" value={`${analysis.climate_telemetry.eto_evapotranspiration_mm} mm`} detail={`ETo / zi · ${analysis.climate_telemetry.distance_km} km`} tone="amber" />
          <MetricCard icon={TrendingUp} label="Profit recomandat" value={`${bestProfit.toLocaleString("ro-MD")} MDL`} detail={`${bestCrop?.crop_name || "Cultura optimă"} / ha`} tone="violet" />
        </section>

        <section className="page-section space-y-4">
          <SectionHeading eyebrow="02 / Context" title="Înțelege terenul înainte de decizie" description="Profilul solului, telemetria și recomandarea AI într-o singură privire." />
          <ParcelInfoCard
            soil={analysis.soil_profile}
            climate={analysis.climate_telemetry}
            aiGuidance={analysis.ai_guidance}
          />
        </section>

        <section id="recommendations" className="page-section content-panel scroll-mt-24 rounded-[28px] border border-slate-200/80 bg-white/65 p-4 shadow-sm sm:p-6">
          <SectionHeading eyebrow="03 / Recomandări" title="Culturile potrivite pentru parcela ta" description="Compară rapid potrivirea, randamentul și profitul net estimat." />
          <div className="mt-5">
            <CropCardsGrid crops={analysis.recommended_crops} />
          </div>
        </section>

        <section id="financial" className="page-section content-panel scroll-mt-24 rounded-[28px] border border-slate-200/80 bg-white/65 p-4 shadow-sm sm:p-6">
          <SectionHeading eyebrow="04 / Financiar" title="Profitabilitate transparentă" description="Vezi cum se raportează investiția la profitul net pentru fiecare cultură." />
          <div className="mt-5">
            <FinancialChart crops={analysis.recommended_crops} />
          </div>
        </section>
      </main>

      <button
        onClick={() => setIsChatOpen(true)}
        className="chat-launcher fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-900/25 transition hover:-translate-y-1 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        aria-label="Deschide Consultant AI"
      >
        <Bot className="h-4 w-4 text-emerald-300" />
        <span className="hidden sm:inline">Consultant AI</span>
      </button>

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} analysis={analysis} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} analysis={analysis} />

      <footer className="mt-10 border-t border-slate-200/80 bg-white/70 py-8 text-center text-xs text-slate-500 backdrop-blur">
        <div className="mx-auto max-w-[1480px] space-y-2 px-4">
          <p className="font-bold tracking-tight text-slate-700">AgriTech AI Guidance Moldova <span className="mx-1 text-emerald-500">•</span> 2026</p>
          <p>Decizii agronomice inteligente, susținute de date locale și calcule transparente.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#17211B]">{title}</h2>
      <p className="mt-1 text-sm text-[#647067]">{description}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "violet";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  }[tone];

  return (
    <div className="metric-card group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className={`rounded-xl p-2.5 ${styles}`}><Icon className="h-4 w-4" /></div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{value}</p>
      <p className="mt-2 truncate text-xs text-slate-500">{detail}</p>
    </div>
  );
}
