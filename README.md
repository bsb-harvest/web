# 🌱 AgriTech AI Guidance Moldova

Un asistent agronomic și economic inteligent dedicat agricultorilor din Republica Moldova, creat pentru optimizarea selecției culturilor, prognoza deterministă a producției (t/ha), calculul devizului detaliat de costuri și maximizarea profitabilității prin integrarea datelor locale de pe **`soluri.gov.md`**, **`agrodat.md`** și a modelului **Google Gemini**.

---

## 🎯 Obiectivele Platformei

* **Alegerea Culturii Optime:** Corelarea automată a tipului de sol și a climei locale cu cerințele biologice ale plantelor.
* **Predicția Deterministă a Recoltei (t/ha):** Calcul bazat pe nota de bonitate a solului și rezerva utilă de apă (fără halucinații AI).
* **Bilanț Financiar Transparent:** Calculul investiției per hectar (semințe, motorină, îngrășăminte NPK, pesticide, lucrări mecanizate) vs. venituri la prețurile pieței din Republica Moldova (MDL/ha).
* **Consultant Agronomic AI (Google Gemini):** Sinteză contextualizată, avertizări timpurii privind bolile fungice (mană, fuzarioză) și asolament pe 4 ani.

---

## 🏗️ Arhitectura Hibridă (Anti-Halucinație)

> [!IMPORTANT]
> **Regula de Aur a Sistemului:**
> Inteligența Artificială (LLM) **NU** calculează direct banii sau recolta.
> **Backend-ul calculează matematic cifrele exacte**, iar **Google Gemini** acționează ca un consultant agronomic de elită care interpretează rezultatele și ghidează fermierul în limbaj natural.

```
                    +------------------------------------+
                    |        DATE PARCELĂ FERMIER        |
                    +-----------------+------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                  MOTORUL DETERMINIST (Persoana 4)                        |
| * Recoltă (t/ha) = Bonitate * Coef_Umiditate * Factor_Soi * Eroziune     |
| * Cost (MDL/ha) = Semințe + NPK + Motorină + Tratamente + Mecanizare     |
| * Profit Net (MDL/ha) = (Recoltă * Preț_Piață_MDL) - Costuri_Totale     |
+--------------------------------------------------------------------------+
                                      |
                                      v [Date Structurate JSON]
+--------------------------------------------------------------------------+
|                  STRATUL COGNITIV (Persoana 5 - Gemini)                  |
| * Sinteză agronomică clară pe înțelesul agricultorului                   |
| * Avertizări fitosanitare (ore umiditate pe frunză > 6h -> risc mană)    |
| * Recomandări de asolament și măsuri agrotehnice corective               |
+--------------------------------------------------------------------------+
```

---

## 👥 Repartizarea Echipei pe 5 Roluri (Zero-Blocking)

| Rol | Persoană | Director Alocat | Tehnologii |
| :--- | :--- | :--- | :--- |
| **Persoana 1** | Frontend & GIS Developer | `frontend/` | Next.js, React, TailwindCSS, Leaflet, Lucide Icons, PWA |
| **Persoana 2** | Backend Core & Database | `backend/app/api/`, `db/` | Python 3.11+, FastAPI, PostgreSQL + PostGIS, Docker |
| **Persoana 3** | Data Engineer & Ingestie | `backend/app/data_pipeline/` | GeoPandas, Shapely, Requests, APScheduler, agrodat.md & soluri.gov.md |
| **Persoana 4** | Agronomie & Finanțe | `backend/app/agronomic_engine/` | Formule deterministe de bonitate, randament și marjă MDL/ha, PyTest |
| **Persoana 5** | AI & Rapoarte Executive | `backend/app/ai_service/` | Google Gemini API (`google-genai`), Detecție Boli, Export Raport PDF |

---

## ⚡ Integrare în JetBrains IDE (PyCharm / WebStorm / IDEA)

Proiectul este pre-configurat cu **Run Configurations (1-Click)** în folderul `.idea/runConfigurations/`:

1. **`Run Backend (FastAPI)`**: Pornește serverul FastAPI pe `http://localhost:8000` (cu documentație Swagger pe `/docs`).
2. **`Run Frontend (Next.js)`**: Pornește interfața web pe `http://localhost:3000`.
3. **`Run Pytest (Agronomic & API Tests)`**: Execută suita completă de teste unitare cu 100% rată de succes.
4. **`Run Data Pipeline (Worker)`**: Sincronizează datele meteorologice de la stațiile din Moldova.

---

## 🚀 Ghid Rapid de Pornire din Terminal

### 1. Pornire Backend (FastAPI)
```bash
cd backend

# Activare mediu virtual pre-creat
.\venv\Scripts\activate      # Windows

# Rulare teste unitare
pytest -v tests

# Pornire server API
uvicorn app.main:app --reload --port 8000
```
* API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* Mock Contract Day 1: [http://localhost:8000/api/v1/mock/contract](http://localhost:8000/api/v1/mock/contract)

### 2. Pornire Frontend (Next.js)
```bash
cd frontend

# Pornire server de dezvoltare
npm run dev
```
* Interfață Utilizator: [http://localhost:3000](http://localhost:3000)

### 3. Pornire cu Docker Compose (Opțional)
```bash
# Ridică PostGIS + Redis + Backend + Frontend
docker compose up -d
```

---

## 📁 Structura Completă a Proiectului

```text
D:\Documente\Agritech\
├── .idea/                             # Configurație JetBrains IDE
│   └── runConfigurations/            # Configurații 1-Click Run/Debug
│       ├── Run_Backend_FastAPI.xml
│       ├── Run_Frontend_Dev.xml
│       ├── Run_Pytest_Agronomic.xml
│       └── Run_Data_Pipeline.xml
├── docs/                              # Documentația de proiect
│   ├── ARCHITECTURE.md                # Arhitectura tehnică detaliată
│   ├── TEAM_TASKS_5_PERSONS.md        # Foaia de lucru pentru cei 5 membri
│   ├── API_CONTRACT.json              # Contractul JSON Schema standard
│   ├── DECISIONS_JOURNAL.md           # Jurnalul conversației și al deciziilor
│   └── QUICKSTART.md                  # Ghid scurt de instalare și rulare
├── backend/                           # Server Python FastAPI (P2, P3, P4, P5)
│   ├── venv/                          # Mediu virtual Python izolat
│   ├── app/
│   │   ├── main.py                    # Punctul de intrare FastAPI
│   │   ├── core/config.py             # Configurație și variabile .env
│   │   ├── models/                    # Pydantic Schemas & tabele PostGIS
│   │   ├── db/session.py              # Conexiune bază de date
│   │   ├── agronomic_engine/          # PERSOANA 4: Formule deterministe de randament & cost
│   │   │   ├── crops_database.py      # Baza de date a celor 6 culturi din Moldova
│   │   │   ├── suitability.py         # Calcul scor potrivire ecologică
│   │   │   ├── yield_calculator.py    # Randament min-max t/ha bazat pe bonitate
│   │   │   ├── financial_engine.py    # Calcul deviz cheltuieli MDL/ha & profit
│   │   │   └── calculator.py          # Fațada calculate_crop_economics()
│   │   ├── ai_service/                # PERSOANA 5: Google Gemini & Rapoarte
│   │   │   ├── gemini_client.py       # Client Gemini cu fallback inteligent
│   │   │   ├── disease_detector.py    # Reguli agronomice risc boli fungice
│   │   │   ├── prompt_builder.py      # Prompturi structurate în limba română
│   │   │   ├── chat_service.py        # Asistent conversațional cu memorie
│   │   │   └── report_generator.py    # Generator raport executiv imprimabil
│   │   ├── data_pipeline/             # PERSOANA 3: Conectori soluri.gov.md & agrodat.md
│   │   │   ├── agrodat_extractor.py   # Telemetrie stații meteo
│   │   │   ├── soluri_extractor.py    # Harta pedologică a solurilor
│   │   │   ├── spatial_matcher.py     # Intersecție poligon parcelă & distanță stație
│   │   │   └── seed/                  # Mostre de date reale din Moldova
│   │   └── api/v1/endpoints/          # PERSOANA 2: Rute API REST
│   │       ├── mock.py                # Endpoint Mock pentru unblocking Ziua 1
│   │       ├── parcels.py             # Endpoint principal POST /parcels/analyze
│   │       ├── soils.py               # GET /soils/lookup
│   │       ├── weather.py             # GET /weather/telemetry
│   │       ├── crops.py               # GET /crops/
│   │       ├── chat.py                # POST /chat/
│   │       └── reports.py             # POST /reports/html
│   ├── tests/                         # Pytest: 11 teste unitare trecute cu 100%
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                          # Aplicație Web PWA (PERSOANA 1)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Dashboard central complet
│   │   │   ├── layout.tsx             # Structură HTML & suport Leaflet
│   │   │   └── globals.css            # Stiluri TailwindCSS & Leaflet
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Bară de navigare cu status live/mock
│   │   │   ├── ParcelMap.tsx          # Hartă satelitară Leaflet cu desenare poligon
│   │   │   ├── ParcelInfoCard.tsx     # Carduri profil sol + telemetrie meteo
│   │   │   ├── CropCardsGrid.tsx      # Carduri ierarhice culturi agricole
│   │   │   ├── FinancialChart.tsx     # Grafic comparativ investiție vs profit
│   │   │   ├── AIChatPanel.tsx        # Panou asistent Dr. Agro AI
│   │   │   └── ReportModal.tsx        # Fereastră raport executiv cu funcție de print
│   │   ├── lib/
│   │   │   ├── api.ts                 # Client API cu comutare automată pe Mock
│   │   │   └── types.ts               # Tipuri TypeScript conforme contractului
│   │   └── mock/defaultParcelData.ts  # Date de simulare de înaltă fidelitate
│   ├── public/manifest.json           # Configurație PWA
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml                 # PostGIS 16 + Redis + Backend + Frontend
├── .env.example                       # Model variabile de mediu
└── .gitignore                         # Excluderi Git optimizate
```
