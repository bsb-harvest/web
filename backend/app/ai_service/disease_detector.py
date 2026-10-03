"""
Modul de detecție a riscurilor fitosanitare și climatice.
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.3: Reguli agronomice pentru boli fungice și riscuri meteorologice.
"""

from typing import List
from app.models.schemas import SoilProfile, ClimateTelemetry


def detect_phytosanitary_risks(
    soil: SoilProfile,
    climate: ClimateTelemetry
) -> List[str]:
    """
    Identifică riscurile fitosanitare și agronomice specifice parcelei
    pe baza orelor de umiditate pe frunze, a umidității solului și a caracteristicilor pedologice.
    """
    risks: List[str] = []

    # 1. Risc de boli fungice bazat pe umiditatea pe frunze (Leaf Wetness Duration)
    if climate.leaf_wetness_hours >= 6.0:
        risks.append(
            "Risc ridicat de infecții fungice (Mană / Plasmopara, Fuzarioză și Făinare) cauzat de umiditatea prelungită pe frunze (>6 ore)."
        )
    elif climate.leaf_wetness_hours >= 4.0:
        risks.append(
            "Risc moderat de Septorioză și Rugină pe aparatul foliar; se recomandă monitorizarea atentă a semnelor incipiente."
        )
    else:
        risks.append(
            "Risc scăzut de fuzarioză și mană datorită duratei reduse a umidității pe frunză în ultimele 24h."
        )

    # 2. Risc de deficit hidric / secetă pedologică
    if climate.soil_moisture_pct < 30.0:
        risks.append(
            "Deficit hidric sever în stratul radicular (umiditate <30%); risc crescut de avortare a florilor sau încetinire a vegetației."
        )
    elif climate.soil_moisture_pct < 40.0:
        risks.append(
            "Rezervă utilă de apă moderat-limitativă în sol (30-40%); se recomandă culturi cu rezistență ridicată la secetă."
        )

    # 3. Risc de evapotranspirație excesivă (stres termic)
    if climate.eto_evapotranspiration_mm > 5.0 and climate.precipitation_last_30d_mm < 25.0:
        risks.append(
            "Stres termohidric accentuat: evapotranspirația depășește aportul precipitațiilor din ultima lună."
        )

    # 4. Riscuri pedologice (pH și eroziune)
    if soil.ph < 5.8:
        risks.append("Sol acid (pH < 5.8): risc de blocare a fosforului asimilabil și toxicitate de aluminiu.")
    elif soil.ph > 8.0:
        risks.append("Sol alcalin (pH > 8.0): disponibilitate scăzută a microelementelor (fier, zinc, mangan).")

    if soil.erosion_grade in ["moderat", "puternic"]:
        risks.append(
            f"Teren cu eroziune {soil.erosion_grade}: risc crescut de spălare a stratului fertil și scurgere de suprafață la ploi torențiale."
        )

    return risks
