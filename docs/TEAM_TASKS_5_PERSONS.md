# 👥 Plan de Execuție și Diviziune a Muncii în Paralel (Echipă de 5 Persoane)
## Proiect: AgriTech AI Guidance Moldova

> **Arhitectură Zero-Blocking:** Fiecare membru al echipei poate lucra independent începând din Ziua 1, având la dispoziție contractul comun de date (`docs/API_CONTRACT.json`) și suportul de Mock-uri.

---

## 🎯 Regula de Bază a Sistemului Hibrid (Anti-Halucinație)
* **Backend-ul (Persoana 4):** Calculează strict matematic și determinist cifrele: recolta minimă/maximă (t/ha), devizul de costuri per hectar (MDL/ha), veniturile și profitul net.
* **AI Service (Persoana 5 - Google Gemini):** Primește datele gata calculate și joacă rolul de Consultant Agronomic de elită: sintetizează contextul, detectează anomalii fitosanitare (boli fungice pe baza umidității pe frunză) și formulează recomandări practice în limbaj natural.

---

## 👤 Repartizarea Task-urilor pe Roluri

### 👤 PERSOANA 1: Frontend & GIS Developer
* **Tech Stack:** Next.js (React), TailwindCSS, Leaflet / MapLibre GL, Lucide Icons, PWA
* **Folder alocat:** `frontend/`
* **Task-uri:**
  * **Task 1.1:** Inițializare interfață web responsivă cu suport PWA. Integrare client API cu fallback pe Mock data.
  * **Task 1.2:** Hartă satelitară interactivă (Leaflet/MapLibre) cu instrument de desenare a poligonului parcelei agricole și calcul automat al ariei (ha).
  * **Task 1.3:** Selector de localități și căutare după număr cadastral.
  * **Task 1.4:** Dashboard vizual cu carduri interactive de culturi (Randament, Costuri, Profit MDL), indicatori de bonitate și umiditate.
  * **Task 1.5:** Panou lateral de chat cu Asistentul Agronomic AI și buton de export/printare raport executiv.

---

### 👤 PERSOANA 2: Backend Core & Database Engineer
* **Tech Stack:** Python 3.11+, FastAPI, PostgreSQL 16 cu PostGIS, SQLAlchemy / GeoAlchemy2, Docker
* **Folder alocat:** `backend/app/api/`, `backend/app/db/`, `backend/app/core/`
* **Task-uri:**
  * **Task 2.1:** Configurare server FastAPI modular și `docker-compose.yml` (PostGIS + Redis).
  * **Task 2.2:** Expunere rute Mock (`/api/v1/mock/contract` și `/api/v1/mock/analyze`) pentru a debloca Persoana 1 din prima zi.
  * **Task 2.3:** Definire tabele spațiale PostGIS: `parcels`, `soil_profiles`, `weather_stations`, `telemetry_records`.
  * **Task 2.4:** Funcții de intersecție spațială: determinare profil sol pe baza poligonului și identificarea celei mai apropiate stații meteo.
  * **Task 2.5:** Orchestrarea endpoint-ului principal `POST /api/v1/parcels/analyze` prin apelarea motorului agronomic (P4) și a serviciului AI (P5).

---

### 👤 PERSOANA 3: Data Engineer & Integration Specialist
* **Tech Stack:** Python, Requests / Playwright / BeautifulSoup, GeoPandas, Shapely, APScheduler
* **Folder alocat:** `backend/app/data_pipeline/`
* **Task-uri:**
  * **Task 3.1:** Analiză și conector `soluri.gov.md` (interogare straturi WFS / GeoJSON / Shapefiles).
  * **Task 3.2:** Normalizare date pedologice: tip sol, humus %, pH, nota de bonitate, grad de eroziune.
  * **Task 3.3:** Conector telemetrie `agrodat.md` (stații meteo, senzori agro-climatici).
  * **Task 3.4:** Extragere indicatori dinamici: temperatură aer/sol, umiditate sol pe adâncimi, ore umiditate pe frunză, precipitații cumulate, $ETo$.
  * **Task 3.5:** Worker de sincronizare periodică (cron/scheduler) cu gestionarea erorilor și a stațiilor offline.

---

### 👤 PERSOANA 4: Agronomic & Financial Logic Engineer
* **Tech Stack:** Python (Librărie independentă de calcul matematic), Pydantic, PyTest
* **Folder alocat:** `backend/app/agronomic_engine/`
* **Task-uri:**
  * **Task 4.1:** Baza de date pentru 6 culturi reprezentative din Moldova (Grâu de toamnă, Porumb, Floarea-soarelui, Rapiță, Soia, Orz).
  * **Task 4.2:** Matricea de pretabilitate ecologică (pH optim, cerințe textură sol, coeficient Kc de consum hidric, toleranță la secetă).
  * **Task 4.3:** Algoritmul de randament: formulă deterministă care corelează bonitatea solului cu umiditatea și temperatura pentru calculul producției (min - max tone/ha).
  * **Task 4.4:** Modul financiar: deviz de costuri în MDL/ha (semințe, motorină, NPK, pesticide, lucrări mecanizate) și profitul net raportat la prețurile pieței din Moldova.
  * **Task 4.5:** Teste unitare (PyTest) cu acoperire 100% a formulelor de calcul.

---

### 👤 PERSOANA 5: AI & LLM Integration Engineer
* **Tech Stack:** Python, Google Gemini API (`google-genai`), Prompt Engineering, Rapoarte Executive
* **Folder alocat:** `backend/app/ai_service/`
* **Task-uri:**
  * **Task 5.1:** Conectare Google Gemini SDK (`google-genai`) cu răspunsuri structurate JSON.
  * **Task 5.2:** Concepere prompturi agronomice contextuale: injectarea cifrelor calculate de P4 și a profilului de sol/meteo de la P3.
  * **Task 5.3:** Modul de detecție a riscurilor fitosanitare: reguli agronomice pentru boli fungice (mană, făinare, fuzarioză, rugină) bazate pe orele de umiditate pe frunză și temperatură.
  * **Task 5.4:** Asistent conversațional cu memorie de context pentru discuții interactive cu fermierul.
  * **Task 5.5:** Generator de rapoarte executive HTML/PDF pentru fermieri sau dosare de subvenționare (AIPA).
