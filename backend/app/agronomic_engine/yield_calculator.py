"""
Algoritmul determinist de prognoză a randamentului recoltei (t/ha).
Responsabilitate: Persoana 4 (Agronomic & Financial Logic Engineer)
Task 4.3: Corelare nota de bonitate, umiditatea solului si coeficientul culturii.
"""

from typing import Tuple
from app.models.schemas import SoilProfile, ClimateTelemetry, EstimatedYield
from app.agronomic_engine.crops_database import CropProfile


def calculate_crop_yield(
    crop: CropProfile,
    soil: SoilProfile,
    climate: ClimateTelemetry
) -> EstimatedYield:
    """
    Calculează intervalul realist de recoltă (min_t_ha, max_t_ha) pe baza:
    - Notei de bonitate (puncte soluri.gov.md)
    - Rezervei utile de apă și precipitațiilor cumulate (agrodat.md)
    - Evapotranspirației ETo și a coeficientului biologic Kc
    """
    # 1. Producția de bază determinată de bonitatea solului
    base_potential = soil.bonitate_points * crop.base_bonitate_yield_ratio

    # 2. Coeficientul hidric (apă sol + precipitații recente vs evapotranspirație ETo)
    # Raport ideal umiditate sol ~50%
    moisture_ratio = climate.soil_moisture_pct / 50.0
    
    # Impactul consumului de apă Kc
    water_balance_factor = (
        0.5 + 
        (0.3 * min(1.5, moisture_ratio)) +
        (0.2 * min(1.0, climate.precipitation_last_30d_mm / 45.0))
    )

    # Dacă ETo este foarte ridicat (> 5 mm/zi) și precipitațiile sunt mici, apare stres termic
    if climate.eto_evapotranspiration_mm > 5.0 and climate.precipitation_last_30d_mm < 20.0:
        water_balance_factor *= 0.88

    # 3. Factorul de eroziune
    erosion_factors = {
        "lipsa": 1.0,
        "slab": 0.95,
        "moderat": 0.85,
        "puternic": 0.70
    }
    erosion_coeff = erosion_factors.get(soil.erosion_grade, 0.90)

    # Producția medie estimată
    expected_yield = base_potential * water_balance_factor * erosion_coeff

    # 4. Calcul interval min - max (marjă realistă de variație meteo ±12-15%)
    min_yield = round(max(0.5, expected_yield * 0.85), 2)
    max_yield = round(max(min_yield + 0.3, expected_yield * 1.15), 2)

    return EstimatedYield(min_t_ha=min_yield, max_t_ha=max_yield)
