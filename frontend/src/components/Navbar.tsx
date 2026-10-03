"use client";

import React from "react";
import {
  BarChart3,
  Download,
  LayoutDashboard,
  Map,
  MessageSquareText,
} from "lucide-react";

interface NavbarProps {
  onOpenChat: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChat, onOpenReport }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#dashboard" className="flex shrink-0 items-center gap-2.5">
          <div className="brand-logo flex h-10 w-10 items-center justify-center rounded-xl bg-white p-0.5 shadow-lg shadow-amber-900/10 ring-4 ring-white/80">
            <img
              src="/agritech-logo.png"
              alt="Logo AgriTech AI"
              className="h-full w-full rounded-[10px] object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-base font-extrabold tracking-[-0.03em] text-slate-900 sm:text-lg">AgriTech AI</span>
              <span className="hidden rounded-full bg-agri-100 px-2 py-1 text-[10px] font-bold text-agri-800 sm:inline-flex">Moldova 🇲🇩</span>
            </div>
            <p className="mt-1 hidden text-[10px] font-medium text-slate-500 sm:block">Agricultură ghidată de date</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 lg:flex" aria-label="Navigație principală">
          <NavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="#map" icon={Map} label="Harta" />
          <NavLink href="#analysis" icon={BarChart3} label="Analiză" />
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-emerald-700"
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Consultant AI
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 lg:hidden"
            aria-label="Deschide Consultant AI"
          >
            <MessageSquareText className="h-4 w-4 text-agri-600" />
            <span className="hidden sm:inline">AI</span>
          </button>
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-2 rounded-xl bg-agri-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-700/15 transition hover:-translate-y-0.5 hover:bg-agri-700 sm:px-3.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descarcă raport</span>
            <span className="sm:hidden">Raport</span>
          </button>
        </div>
      </div>
    </header>
  );
};

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <a href={href} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-emerald-700">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
