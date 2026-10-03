"""
Generator de rapoarte executive și fișe tehnice pentru fermieri.
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.5: Export raport complet format HTML / imprimabil.
"""

from app.models.schemas import ParcelAnalysisResponse


def generate_executive_html_report(analysis: ParcelAnalysisResponse) -> str:
    """
    Generează un raport complet în format HTML structurat, optimizat pentru tipărire și export PDF.
    """
    crops_rows = ""
    for crop in analysis.recommended_crops:
        crops_rows += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">{crop.crop_name}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">{crop.suitability_score}%</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">{crop.estimated_yield.min_t_ha} - {crop.estimated_yield.max_t_ha}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">{crop.estimated_costs_mdl_ha:,.0f} MDL</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">{crop.estimated_revenue_mdl_ha:,.0f} MDL</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #166534;">{crop.net_profit_mdl_ha:,.0f} MDL</td>
        </tr>
        """

    risks_list = "".join([f"<li style='margin-bottom: 4px;'>{r}</li>" for r in analysis.ai_guidance.risks])
    actions_list = "".join([f"<li style='margin-bottom: 4px;'>{a}</li>" for a in analysis.ai_guidance.actionable_steps])

    html = f"""<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <title>Raport Agronomic Executiv - AgriTech AI Moldova</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 24px; max-width: 900px; margin: 0 auto; }}
        h1 {{ color: #166534; border-bottom: 2px solid #22c55e; padding-bottom: 8px; }}
        h2 {{ color: #15803d; margin-top: 20px; }}
        .badge {{ background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold; }}
        .grid {{ display: flex; gap: 16px; margin: 16px 0; }}
        .card {{ flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th {{ background: #22c55e; color: white; padding: 8px; text-align: left; border: 1px solid #16a34a; }}
        .highlight-box {{ background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0; }}
        .risk-box {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }}
        @media print {{ body {{ padding: 0; }} button {{ display: none; }} }}
    </style>
</head>
<body>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h1>AgriTech AI Guidance Moldova</h1>
            <p style="color: #64748b; margin-top: -8px;">Raport de Analiză Pedoclimatică & Recomandări Culturi</p>
        </div>
        <button onclick="window.print()" style="background: #16a34a; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Printează / Salvează PDF
        </button>
    </div>

    <div class="grid">
        <div class="card">
            <h3 style="margin-top:0; color:#0f172a;">Date Teren</h3>
            <p><strong>ID Parcelă:</strong> {analysis.parcel_id}</p>
            <p><strong>Cod Cadastral:</strong> {analysis.cadastral_code or 'Nedefinit'}</p>
            <p><strong>Suprafață:</strong> {analysis.area_ha:.2f} hectare</p>
        </div>
        <div class="card">
            <h3 style="margin-top:0; color:#0f172a;">Profil Pedologic (soluri.gov.md)</h3>
            <p><strong>Tip Sol:</strong> {analysis.soil_profile.type}</p>
            <p><strong>Bonitate:</strong> <span class="badge">{analysis.soil_profile.bonitate_points} puncte</span></p>
            <p><strong>Humus / pH:</strong> {analysis.soil_profile.humus_pct}% / pH {analysis.soil_profile.ph}</p>
        </div>
        <div class="card">
            <h3 style="margin-top:0; color:#0f172a;">Telemetrie (agrodat.md)</h3>
            <p><strong>Stație:</strong> {analysis.climate_telemetry.nearest_station_id} ({analysis.climate_telemetry.distance_km} km)</p>
            <p><strong>Umiditate sol:</strong> {analysis.climate_telemetry.soil_moisture_pct}%</p>
            <p><strong>Precipitații 30z:</strong> {analysis.climate_telemetry.precipitation_last_30d_mm} mm</p>
        </div>
    </div>

    <div class="highlight-box">
        <h3 style="margin-top:0; color:#065f46;">Sinteza Asistentului Agronomic AI</h3>
        <p>{analysis.ai_guidance.summary}</p>
    </div>

    <h2>Matricea Comparativă a Culturilor Agricole</h2>
    <table>
        <thead>
            <tr>
                <th>Cultură</th>
                <th style="text-align: center;">Scor Potrivire</th>
                <th style="text-align: center;">Randament (t/ha)</th>
                <th style="text-align: right;">Cost Producție</th>
                <th style="text-align: right;">Venit Estimat</th>
                <th style="text-align: right;">Profit Net / ha</th>
            </tr>
        </thead>
        <tbody>
            {crops_rows}
        </tbody>
    </table>

    <div class="risk-box">
        <h3 style="margin-top:0; color:#b45309;">Avertizări & Riscuri Fitosanitare</h3>
        <ul>{risks_list}</ul>
    </div>

    <div style="background: #f1f5f9; border-left: 4px solid #64748b; padding: 12px; margin: 16px 0;">
        <h3 style="margin-top:0; color:#334155;">Măsuri Agrotehnice Recomandate</h3>
        <ul>{actions_list}</ul>
    </div>

    <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px;">
        Generat automat de platforma AgriTech AI Guidance Moldova &bull; Octombrie 2026
    </p>
</body>
</html>
    """
    return html
