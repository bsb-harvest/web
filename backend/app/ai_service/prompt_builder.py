"""
Constructor de prompturi agronomice pentru Google Gemini API.
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.2: Formatare context agronomic pentru sinteza AI structurată.
"""

from typing import List
from app.models.schemas import SoilProfile, ClimateTelemetry, RecommendedCrop


SYSTEM_AGRONOMIC_PROMPT = """Ești Dr. Agro, un consultant agronomic de elită specializat în agricultura Republicii Moldova și bunele practici europene.
Misiunea ta este să oferi fermierului recomandări agronomice clare, practice și profitabile.
REGULI STRICTE:
1. NU inventa cifre financiare sau de randament! Bazează-te EXCLUSIV pe datele agronomice și financiare calculate și transmise în context.
2. Formulează un rezumat agronomic concis, evidențiază cultura optimă și motivează alegerea.
3. Menționează măsurile agrotehnice corective (asolament, fertilizare specifică, lucrări de conservare a apei).
4. Răspunde întotdeauna în limba română, într-un ton profesionist, direct și empatic cu fermierul.
"""


def build_analysis_prompt(
    soil: SoilProfile,
    climate: ClimateTelemetry,
    crops: List[RecommendedCrop],
    area_ha: float,
    detected_risks: List[str]
) -> str:
    """
    Construiește promptul complet conținând contextul pedoclimatic și calculele economice.
    """
    crops_text = "\n".join([
        f"- {c.crop_name}: Scor potrivire {c.suitability_score}%, Randament prognozat: {c.estimated_yield.min_t_ha} - {c.estimated_yield.max_t_ha} t/ha, "
        f"Cost: {c.estimated_costs_mdl_ha} MDL/ha, Venit: {c.estimated_revenue_mdl_ha} MDL/ha, Profit net: {c.net_profit_mdl_ha} MDL/ha"
        for c in crops[:4]
    ])

    risks_text = "\n".join([f"- {r}" for r in detected_risks])

    prompt = f"""
Evaluează următoarea parcelă agricolă din Republica Moldova cu suprafața de {area_ha} hectare:

[PROFIL PEDOLOGIC SOLURI.GOV.MD]
- Tip sol: {soil.type}
- Nota de bonitate: {soil.bonitate_points} puncte (din 100)
- Conținut de humus: {soil.humus_pct}%
- pH sol: {soil.ph}
- Grad de eroziune: {soil.erosion_grade}

[TELEMETRIE AGROMETEOROLOGICĂ AGRODAT.MD]
- Stație de referință: {climate.nearest_station_id} (la distanța de {climate.distance_km} km)
- Umiditate sol actuală: {climate.soil_moisture_pct}%
- Durată umiditate pe frunze (ultimele 24h): {climate.leaf_wetness_hours} ore
- Precipitații ultimele 30 zile: {climate.precipitation_last_30d_mm} mm
- Evapotranspirație de referință ETo: {climate.eto_evapotranspiration_mm} mm/zi

[REZULTATE ECONOMICE ȘI DE RANDAMENT CALCULATE MATEMATIC]
{crops_text}

[RISCURI FITOSANITARE ȘI METEOROLOGICE DETECTATE]
{risks_text}

Te rog să generezi:
1. Un rezumat agronomic (2-3 propoziții) explicând pe scurt starea parcelei și care cultură oferă cel mai bun echilibru risc/profit.
2. Lista riscurilor prioritare pentru fermier.
3. 2-4 măsuri agrotehnice practice și imediate (ex: semănat timpuriu, fertilizare fracționată, scarificare, tratamente fungice).
"""
    return prompt.strip()
