"""
Teste pentru modulul de detecție a riscurilor fitosanitare.
Persoana 5: AI & LLM Integration Engineer
Task 5.3: Validare avertizări mană, făinare, fuzarioză și deficit hidric.
"""

from app.models.schemas import SoilProfile, ClimateTelemetry
from app.ai_service.disease_detector import detect_phytosanitary_risks


def test_fungal_disease_alert_on_high_leaf_wetness():
    soil = SoilProfile(
        type="Cernoziom",
        bonitate_points=80,
        humus_pct=3.5,
        ph=7.0,
        erosion_grade="slab"
    )
    wet_climate = ClimateTelemetry(
        nearest_station_id="agro-st-chisinau-01",
        distance_km=3.0,
        soil_moisture_pct=45.0,
        leaf_wetness_hours=7.5,  # Peste 6 ore -> risc crescut
        precipitation_last_30d_mm=40.0,
        eto_evapotranspiration_mm=3.8
    )

    risks = detect_phytosanitary_risks(soil, wet_climate)
    assert any("infecții fungice" in r or "Mană" in r for r in risks)


def test_drought_warning_on_low_moisture():
    soil = SoilProfile(
        type="Cernoziom",
        bonitate_points=65,
        humus_pct=2.8,
        ph=7.5,
        erosion_grade="moderat"
    )
    dry_climate = ClimateTelemetry(
        nearest_station_id="agro-st-cahul-01",
        distance_km=5.0,
        soil_moisture_pct=22.0,  # Sub 30% -> deficit sever
        leaf_wetness_hours=1.0,
        precipitation_last_30d_mm=8.0,
        eto_evapotranspiration_mm=6.2
    )

    risks = detect_phytosanitary_risks(soil, dry_climate)
    assert any("Deficit hidric sever" in r for r in risks)
