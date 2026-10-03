"use client";

import React from "react";
import { Sprout, FileDown, MessageSquareText, ShieldCheck, Activity } from "lucide-react";

interface NavbarProps {
  isMock: boolean;
  onOpenChat: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMock, onOpenChat, onOpenReport }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-agri-700 to-agri-500 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                AgriTech AI Guidance
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-agri-100 text-agri-800">
                Moldova 🇲🇩
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Decizii agronomice inteligente &bull; agrodat.md &amp; soluri.gov.md
            </p>
          </div>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
            isMock 
              ? "bg-amber-50 text-amber-700 border-amber-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isMock ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span>{isMock ? "Mod Simulare (Mock Day 1)" : "Backend Conectat (Live)"}</span>
          </div>

          {/* Chat Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <MessageSquareText className="w-4 h-4 text-agri-600" />
            <span className="hidden md:inline">Consultant AI</span>
          </button>

          {/* Report Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-agri-600 hover:bg-agri-700 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Raport Executiv</span>
          </button>
        </div>
      </div>
    </header>
  );
};
