# Jurnal de Decizii și Conversație — Proiect BEST MINDS
## Subiect: AgriTech AI Guidance Moldova
**Data generării:** Octombrie 2026  
**Locație proiect:** `D:\Documente\BEST MINDS`

---

## 1. Sinteza Conversației și a Cerințelor Inițiale

### Întrebarea Utilizatorului:
> *"Vrem să facem un AI Guidance pentru agricultori care să îi ajute să ia decizii asupra ce culturi să pună în sol, colectând date de pe agrodat.md și soluri.gov.md (temperatură aer/sol, precipitații, umiditate frunze, radiație solară, vânt, umiditate sol, evapotranspirație, macro/micro elemente, tip sol). Pe baza acestor date, AI-ul să sfătuiască fermierul ce să cultive, tonajul obținut, costuri, investiții, profit, potențialul solului. Vrem să facem printr-un site web... este mai bine prin API de la AI, frontend și backend separat?"*

---

## 2. Deciziile Cheie de Arhitectură Adoptate

### A. Tipul Aplicației: Web App Responsive (PWA)
* **Motiv:** Fermierii trebuie să poată desena parcele pe ecran mare la birou (desktop) și să verifice starea terenului prin GPS direct pe câmp (telefon mobil). O aplicație Web PWA elimină costurile dezvoltării separate pentru Android/iOS.

### B. Arhitectură Decuplată: Frontend separat de Backend
* **Securitate:** Cheile API (Google Gemini, baze de date) nu trebuie expuse în codul clientului.
* **Procesare GIS:** Suprapunerea parcelelor peste harta pedologică a Moldovei necesită motoare geospațiale (PostGIS, GeoPandas).
* **Ingestie Date:** Scraping-ul și interogarea `agrodat.md` și `soluri.gov.md` trebuie executate în fundal de către server (cron jobs).

### C. Strategia AI: Sistem Hibrid (Anti-Halucinație)
* **Problema:** Dacă un model AI (LLM) este întrebat direct *"Cât porumb voi recolta și ce profit am?"*, acesta va inventa cifre financiare sau agronomice nerealiste.
* **Soluția:** 
  1. **Backend-ul calculează matematic:** randamentul (t/ha pe baza bonității solului și a apei) și devizul de costuri în MDL/ha.
  2. **Google Gemini 2.5 Flash devine Consultantul:** primește datele gata calculate și formulează recomandarea agronomică, explică riscurile (boli fungice din cauza umidității pe frunză, secetă) și răspunde la întrebările fermierului.

---

## 3. Fișierele Generate în Proiectul BEST MINDS

Toate materialele au fost salvate direct în folderul `D:\Documente\BEST MINDS\`:

| Fișier | Format | Descriere |
| :--- | :--- | :--- |
| **`Plan_Impartire_Taskuri_5_Persoane_AgriTech.doc`** | Microsoft Word (.doc) | Planul detaliat de diviziune a muncii pentru 5 persoane, cu roluri, task-uri pe săptămâni și contract JSON. Gata de printat sau distribuit echipei. |
| **`AgriTech_AI_Guidance_Arhitectura_si_Plan.md`** | Markdown (.md) | Documentul complet de arhitectură tehnică, fluxuri de date, diagrame Mermaid și schema bazei de date PostGIS. |
| **`Jurnal_Conversatie_si_Decizii_Proiect.md`** | Markdown (.md) | Acest document: istoricul cerințelor, justificarea deciziilor tehnice și pașii de lucru. |

---

## 4. Repartizarea Echipei pe Roluri (Rezumat Rapid)

* **Persoana 1 (Frontend & GIS):** Next.js, Tailwind, Harta Leaflet/MapLibre, instrument de desenare parcele, Dashboard cu grafice.
* **Persoana 2 (Backend & PostGIS):** FastAPI, Docker, baza de date PostgreSQL + PostGIS, rute API cu răspunsuri Mock din Ziua 1.
* **Persoana 3 (Data Engineer):** Ingestia datelor de pe `soluri.gov.md` (harta solurilor) și `agrodat.md` (rețeaua stațiilor meteo).
* **Persoana 4 (Agronomie & Finanțe):** Formulele de calcul pentru recolte (t/ha pe baza bonității) și cheltuieli/profit în MDL/ha.
* **Persoana 5 (AI & Rapoarte):** Integrarea Google Gemini API, prompturi agronomice, detecție risc boli și generatorul de rapoarte PDF.

---

## 5. Următorul Pas Recomandat

Deschideți folderul în editorul de cod (Antigravity IDE sau VS Code):  
`File -> Open Folder -> D:\Documente\BEST MINDS`
