"""
Teste unitare pentru algoritmul de randament (yield_calculator.py).
Persoana 4 — Task 4.4: acoperire completă (bilanț hidric FAO-33, factor termic, eroziune).
"""

import pytest
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CROPS_DATABASE
from app.agronomic_engine.yield_calculator import (
    calculate_crop_yield,
    _water_factor,
    _thermal_factor,
)

CROP_NAMES = list(CROPS_DATABASE.keys())


def make_soil(**kw):
    base = dict(type="Cernoziom", bonitate_points=76, humus_pct=3.8, ph=7.0, erosion_grade="slab")
    base.update(kw)
    return SoilProfile(**base)


def make_climate(**kw):
    base = dict(
        nearest_station_id="st", distance_km=4.2, soil_moisture_pct=42.0,
        leaf_wetness_hours=3.5, precipitation_last_30d_mm=28.0, eto_evapotranspiration_mm=4.5,
    )
    base.update(kw)
    return ClimateTelemetry(**base)


@pytest.mark.parametrize("crop_name", CROP_NAMES)
def test_yield_band_all_crops(crop_name):
    crop = CROPS_DATABASE[crop_name]
    y = calculate_crop_yield(crop, make_soil(), make_climate())
    assert y.min_t_ha >= 0.5
    assert y.max_t_ha > y.min_t_ha


def test_zero_precipitation_still_valid():
    crop = CROPS_DATABASE["Porumb"]
    y = calculate_crop_yield(crop, make_soil(), make_climate(precipitation_last_30d_mm=0.0))
    assert y.min_t_ha >= 0.5
    assert y.max_t_ha > y.min_t_ha


def test_water_factor_zero_eto_guard():
    # ETc = 0 => fără deficit calculabil => factor neutru 1.0 (linia de gardă)
    crop = CROPS_DATABASE["Grau de toamna"]
    assert _water_factor(crop, 0.0, 10.0, 40.0) == 1.0


def test_water_factor_clamped_floor():
    # Deficit hidric extrem => factorul este limitat la 0.2
    crop = CROPS_DATABASE["Porumb"]  # ky 1.25
    f = _water_factor(crop, 10.0, 0.0, 0.0)
    assert f == 0.2


def test_thermal_factor_air_temp_hot():
    assert _thermal_factor(4.0, 30.0, air_temp_c=35.0) == pytest.approx(0.85)


def test_thermal_factor_air_temp_cold():
    assert _thermal_factor(4.0, 30.0, air_temp_c=0.0) == pytest.approx(0.85)


def test_thermal_factor_air_temp_optimal():
    assert _thermal_factor(4.0, 30.0, air_temp_c=20.0) == 1.0


def test_thermal_factor_proxy_stress():
    # ETo > 5 și precipitații < 20 => stres termic/hidric
    assert _thermal_factor(6.0, 10.0) == pytest.approx(0.88)


def test_thermal_factor_proxy_no_stress():
    # ETo mic sau precipitații suficiente => fără penalizare
    assert _thermal_factor(3.0, 50.0) == 1.0


def test_calculate_yield_air_temp_param_reduces_min():
    crop = CROPS_DATABASE["Soia"]
    y_hot = calculate_crop_yield(crop, make_soil(), make_climate(), air_temp_c=38.0)
    y_norm = calculate_crop_yield(crop, make_soil(), make_climate(), air_temp_c=20.0)
    assert y_hot.min_t_ha <= y_norm.min_t_ha


def test_erosion_reduces_yield():
    crop = CROPS_DATABASE["Grau de toamna"]
    y_slab = calculate_crop_yield(crop, make_soil(erosion_grade="slab"), make_climate())
    y_strong = calculate_crop_yield(crop, make_soil(erosion_grade="puternic"), make_climate())
    assert y_strong.max_t_ha < y_slab.max_t_ha
