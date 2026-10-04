import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriTech AI Guidance Moldova — Decizii Agronomice Inteligente",
  description:
    "Ghid inteligent pentru fermierii din Republica Moldova bazat pe datele agrodat.md, soluri.gov.md și Google Gemini.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

import { LanguageProvider } from "@/i18n/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
