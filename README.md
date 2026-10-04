# 🌱 AgriTech AI Guidance Moldova

Un asistent agronomic și economic inteligent dedicat agricultorilor din Republica Moldova, creat pentru optimizarea selecției culturilor, prognoza deterministă a producției (t/ha), calculul devizului detaliat de costuri și maximizarea profitabilității prin integrarea datelor oficiale de pe **`soluri.gov.md`**, a datelor de telemetrie de pe **`agrodat.md`**, bazei de date **PostgreSQL + PostGIS pe Aiven Cloud** și a modelului **Google Gemini 3.8 Flash**.

---

## 🎯 Obiectivele Platformei

* **Alegerea Culturii Optime:** Corelarea automată a tipului de sol (cernoziomuri, soluri cenușii, aluviale) și a climei locale cu cerințele biologice ale plantelor.
* **Predicția Deterministă a Recoltei (t/ha):** Calcul matematic robust bazat pe nota de bonitate a solului și rezerva utilă de apă (fără halucinații AI).
* **Bilanț Financiar Transparent (MDL):**
  * Comutator dinamic **Per Hectar (MDL/ha)** vs. **Total Parcelă (MDL)**.
  * Estimare costuri pe categorii: semințe, motorină, îngrășăminte NPK, pesticide, lucrări mecanizate.
  * Prețuri curente de piață din Republica Moldova per tonă.
  * Scenarii comparative de profit: **Pesimist (-15%)**, **Realist**, **Optimist (+15%)**.
  * Comutator flexibil de sortare a culturilor: după **Potrivire Ecologică** sau după **Profit Net Estimativ**.
* **Interacțiune GIS & Cadastru Oficial:**
  * Hartă satelitară interactivă centrată curat pe Republica Moldova (zoom automat fără suprapuneri artificiale).
  * Integrare directă cu cadastrul oficial și straturile WMS oficiale (`soluri.gov.md`).
  * Preluarea prioritară a suprafeței cadastrale oficial înregistrate (eliminând discrepanțele poligoanelor geometrice).
* **Consultant Agronomic AI Multimodal (Google Gemini 3.8 Flash):**
  * Sinteză contextualizată pe baza datelor exacte din sol și meteo.
  * Suport pentru **fișiere atașate multimodale** (fotografii din teren, buletine de analiză de sol, fișiere PDF/scanate).
  * Formatare Markdown completă a răspunsurilor (liste, tabele, avertismente, pași agrotehnici).
  * Avertizări fitosanitare automate (riscuri de mană, fuzarioză) și recomandări de asolament pe 4 ani.

---

## 🏗️ Arhitectura Hibridă (Anti-Halucinație)

> [!IMPORTANT]
> **Regula de Aur a Sistemului:**
> Inteligența Artificială (LLM) **NU** inventează cifrele economice sau randamentele.
> **Backend-ul calculează determinist cifrele exacte**, iar **Google Gemini** acționează ca un consultant agronomic de elită care interpretează rezultatele, explică deciziile și răspunde întrebărilor fermierului.

```
                    +------------------------------------+
                    |        DATE PARCELĂ FERMIER        |
                    | (Hartă GIS / Cadastru Oficial / WMS)|
                    +-----------------+------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                  MOTORUL DETERMINIST & FINANCIAR                         |
| * Recoltă (t/ha) = Bonitate * Coef_Umiditate * Factor_Soi * Eroziune     |
| * Cost (MDL) = Semințe + NPK + Motorină + Tratamente + Mecanizare        |
| * Venit (MDL) = Recoltă * Preț_Piață_Moldova                             |
| * Profit Net (MDL) = Venit - Costuri_Totale (Scenarii Min / Med / Max)   |
| * Sortare dinamică: Recomandare ecologică vs. Profitabilitate            |
+--------------------------------------------------------------------------+
                                      |
                                      v [Date Structurate JSON + Atașamente]
+--------------------------------------------------------------------------+
|             STRATUL COGNITIV MULTIMODAL (Gemini 3.8 Flash)               |
| * Sinteză agronomică clară pe înțelesul agricultorului                   |
| * Analiză fotografii sol / frunze / buletine de laborator PDF            |
| * Avertizări fitosanitare (ore umiditate frunză, temperatură sol)        |
| * Recomandări de asolament și măsuri agrotehnice corective               |
+--------------------------------------------------------------------------+
```

---

## 🚀 Funcționalități Recente Implementate

1. **Finanțe Avansate & Calcule Dinamice:**
   - Comutator instant între **Per Hectar (MDL/ha)** și **Total Parcelă (MDL)** pentru toată suprafața selectată.
   - Afișarea prețului de piață curent al fiecărei culturi (ex: Rapiță ~9,200 MDL/t, Grâu ~3,800 MDL/t, Floarea-soarelui ~8,500 MDL/t).
   - Scenarii de rentabilitate minimă și maximă pentru fiecare cultură.
   - Selector de sortare în grilă: **Potrivire agrometeorologică** sau **Profit maxim estimat**.
   - Sortare descrescătoare a graficului financiar pentru comparabilitate vizuală directă.

2. **Cartografiere GIS & Cadastru de Precizie:**
   - Eliminarea poligoanelor fictive predefinite; harta se deschide curat centrată pe Republica Moldova.
   - Preluarea suprafeței oficiale din registrul cadastral (ex: recunoașterea fidelă a parcelelor de 337.41 ha).
   - Rezolvarea problemelor de flicker sau curse asincrone la selecția parcelelor dinamic.
   - Conector oficial WMS către `soluri.gov.md` pentru identificarea straturilor pedologice.

3. **Asistent AI Dr. Agro Multimodal:**
   - Integrare **Google Gemini 3.8 Flash**.
   - Suport complet pentru upload fișiere: imagini din câmp (plante bolnave, dăunători), analize agrochimice și rapoarte PDF.
   - Redare îmbunătățită cu Markdown bogat, tabele agronomice și atenționări structurate.

4. **Securizare & Curățare Istoric Git:**
   - Izolarea totală a credențialelor bazei de date și a cheilor API prin variabile de mediu (`.env`).
   - Audit complet de securitate și curățare prin rescriere de istoric fără expunere de secrete în commituri.

---

## 👥 Repartizarea Echipei pe 5 Roluri

| Rol | Persoană / Modul | Director Alocat | Tehnologii |
| :--- | :--- | :--- | :--- |
| **Persoana 1** | Frontend & GIS Developer | `frontend/` | Next.js 16+, React 19, TailwindCSS, Leaflet, Lucide Icons |
| **Persoana 2** | Backend Core & Database | `backend/app/api/`, `db/` | FastAPI, PostgreSQL 16 + PostGIS pe Aiven Cloud, SQLAlchemy Async, asyncpg |
| **Persoana 3** | Data Pipeline & Ingestie | `backend/app/data_pipeline/` | Shapely, Requests, APScheduler, WMS soluri.gov.md & agrodat.md |
| **Persoana 4** | Agronomie & Finanțe | `backend/app/agronomic_engine/` | Formule deterministe de bonitate, randament și marjă MDL/ha, PyTest |
| **Persoana 5** | AI & Rapoarte Executive | `backend/app/ai_service/` | Google Gemini 3.8 Flash (`google-genai`), Multimodal Chat, Diagnostic Fitosanitar |

---

## ⚙️ Variabile de Mediu (`.env`)

Pentru rulare locală sau în producție, creați fișierele de configurare pornind de la template-urile `.env.example`:

### Backend (`backend/.env`):
```env
# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash

# Setări Aplicație
APP_ENV=development
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Conexiune Bază de Date (PostgreSQL / PostGIS)
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=defaultdb
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=require

# External Data Services
SOLURI_WFS_ENDPOINT=https://soluri.gov.md/geoserver/wfs
AGRODAT_API_ENDPOINT=https://agrodat.md/api/v1
```

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAP_DEFAULT_LAT=47.0105
NEXT_PUBLIC_MAP_DEFAULT_LNG=28.8350
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=8
```

---

## 🚀 Ghid Rapid de Rulare

### 1. Pornire Backend (FastAPI)
```bash
cd backend

# Instalare dependențe
pip install -r requirements.txt

# Rulare teste unitare agronomice
pytest -v tests

# Pornire server API
uvicorn app.main:app --reload --port 8000
```
* Swagger UI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Pornire Frontend (Next.js)
```bash
cd frontend

# Instalare dependențe
npm install

# Build verificare integritate
npm run build

# Pornire server de dezvoltare
npm run dev
```
* Aplicație Web: [http://localhost:3000](http://localhost:3000)

### 3. Rulare cu Docker Compose
```bash
docker compose up --build -d
```

---

## 📁 Structura Proiectului

```text
AgriTech-AI-Guidance/
├── backend/                           # Server Python FastAPI
│   ├── app/
│   │   ├── main.py                    # Entrypoint API
│   │   ├── core/config.py             # Configurație pydantic și variabile de mediu
│   │   ├── models/                    # Pydantic Schemas & modele de date
│   │   ├── db/                        # Conexiune async SQLAlchemy & seed scripts
│   │   ├── agronomic_engine/          # Modele matematice deterministe (randament, costuri, profit)
│   │   ├── ai_service/                # Integrare Google Gemini 3.8 Flash & Chat Multimodal
│   │   ├── data_pipeline/             # Conectori soluri.gov.md & agrodat.md
│   │   └── api/v1/endpoints/          # Rute API REST (parcele, sol, meteo, chat, rapoarte)
│   ├── tests/                         # Teste unitare Pytest
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                          # Aplicație Web Next.js (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Dashboard central integrat
│   │   │   ├── layout.tsx             # Layout aplicație
│   │   │   └── api/cadastre/          # Proxy securizat lookup cadastral
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Navigare cu scroll fin
│   │   │   ├── ParcelMap.tsx          # Hartă Leaflet & WMS soluri.gov.md
│   │   │   ├── ParcelInfoCard.tsx     # Profil pedologic, bonitate, telemetrie meteo
│   │   │   ├── CropCardsGrid.tsx      # Grilă culturi cu comutator de sortare
│   │   │   ├── FinancialChart.tsx     # Grafic financiar comparativ
│   │   │   ├── AIChatPanel.tsx        # Chatbot Dr. Agro AI cu atașamente fișiere
│   │   │   └── ReportModal.tsx        # Generator raport executiv imprimabil
│   │   ├── lib/                       # API client și tipuri TypeScript
│   │   └── mock/                      # Mock dataset de înaltă fidelitate
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
