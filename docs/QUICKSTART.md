# ⚡ Ghid Rapid de Pornire (Quickstart Guide)
## Proiect: AgriTech AI Guidance Moldova

Acest ghid vă arată cum să porniți proiectul în mai puțin de 2 minute pe stația locală sau în JetBrains IDE.

---

## 1. Deschidere în JetBrains (PyCharm / WebStorm / IntelliJ IDEA)

1. Deschideți JetBrains IDE.
2. Selectați `File -> Open` și navigați la folderul `D:\Documente\Agritech`.
3. În colțul din dreapta-sus al IDE-ului veți găsi gata configurate opțiunile de **Run/Debug (1-Click)**:
   * **`Run Backend (FastAPI)`** -> pornește API-ul pe `http://localhost:8000`
   * **`Run Frontend (Next.js)`** -> pornește interfața pe `http://localhost:3000`
   * **`Run Pytest (Agronomic & API Tests)`** -> rulează testele unitare (11 teste trecute)
   * **`Run Data Pipeline (Worker)`** -> rulează workerul de sincronizare a stațiilor meteo

---

## 2. Rulare din Terminal (PowerShell / Command Prompt)

### Backend (Python FastAPI)
```powershell
cd D:\Documente\Agritech\backend

# Activare mediu virtual
.\venv\Scripts\activate

# Rulare teste unitare
pytest -v tests

# Pornire server cu hot-reload
uvicorn app.main:app --reload --port 8000
```
* Swagger UI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* Mock Contract: [http://localhost:8000/api/v1/mock/contract](http://localhost:8000/api/v1/mock/contract)

### Frontend (Next.js & TailwindCSS)
```powershell
cd D:\Documente\Agritech\frontend

# Pornire server Next.js
npm run dev
```
* Aplicația Web: [http://localhost:3000](http://localhost:3000)

---

## 3. Rulare Completă cu Docker Compose (Opțional)

Dacă doriți să porniți baza de date **PostgreSQL 16 + PostGIS**, **Redis**, **Backend-ul** și **Frontend-ul** într-un singur pas:

```powershell
cd D:\Documente\Agritech
docker compose up -d
```

---

## 4. Ce trebuie să facă fiecare membru al echipei?

Consultați documentul complet din `docs/TEAM_TASKS_5_PERSONS.md`:
* **Persoana 1 (Frontend):** Lucrează în `frontend/` (extinde instrumentele de desenare și rapoartele).
* **Persoana 2 (Backend):** Lucrează în `backend/app/api/` și `backend/app/db/` (tabele PostGIS și rute API).
* **Persoana 3 (Data Pipeline):** Lucrează în `backend/app/data_pipeline/` (conectori soluri.gov.md și agrodat.md).
* **Persoana 4 (Agronomie & Finanțe):** Lucrează în `backend/app/agronomic_engine/` (formule randament, deviz costuri).
* **Persoana 5 (AI & Rapoarte):** Lucrează în `backend/app/ai_service/` (prompturi Gemini, analiză riscuri fitosanitare).
