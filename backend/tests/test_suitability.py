"""
Teste unitare pentru matricea de pretabilitate ecologică (suitability.py).
Persoana 4 — Task 4.4: acoperire completă a ramurilor de scor.
"""

import pytest
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CROPS_DATABASE
from app.agronomic_engine.suitability import calculate_suitability_score

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
def test_suitability_bounds_all_crops(crop_name):
    crop = CROPS_DATABASE[crop_name]
    ph = (crop.ph_optimal_min + crop.ph_optimal_max) / 2.0
    score = calculate_suitability_score(crop, make_soil(ph=ph), make_climate())
    assert isinstance(score, int)
    assert 10 <= score <= 98


def test_ph_within_optimal_no_penalty():
    crop = CROPS_DATABASE["Floarea-soarelui"]  # optim 6.5-7.5
    score = calculate_suitability_score(crop, make_soil(ph=7.0), make_climate())
    assert score > 70


def test_ph_outside_but_within_tolerance_mild_penalty():
    crop = CROPS_DATABASE["Floarea-soarelui"]  # optim 6.5-7.5, toleranță 0.6
    s_in = calculate_suitability_score(crop, make_soil(ph=7.0), make_climate())
    s_tol = calculate_suitability_score(crop, make_soil(ph=7.9), make_climate())  # dev 0.4 <= 0.6
    assert s_tol < s_in


def test_ph_beyond_tolerance_severe_penalty():
    crop = CROPS_DATABASE["Floarea-soarelui"]  # toleranță 0.6
    s_tol = calculate_suitability_score(crop, make_soil(ph=7.9), make_climate())   # mild
    s_severe = calculate_suitability_score(crop, make_soil(ph=8.8), make_climate())  # dev 1.3 > 0.6
    assert s_severe < s_tol


def test_humus_deficit_penalty():
    crop = CROPS_DATABASE["Porumb"]  # min_humus 3.0
    s_ok = calculate_suitability_score(crop, make_soil(humus_pct=3.8, ph=7.0), make_climate())
    s_deficit = calculate_suitability_score(crop, make_soil(humus_pct=1.0, ph=7.0), make_climate())
    assert s_deficit < s_ok


@pytest.mark.parametrize("crop_name,tolerance", [
    ("Porumb", "scazuta"),
    ("Soia", "scazuta"),
    ("Grau de toamna", "medie"),
    ("Rapita", "medie"),
    ("Floarea-soarelui", "ridicata"),
    ("Orz de toamna", "ridicata"),
])
def test_drought_branches_all_tolerances(crop_name, tolerance):
    crop = CROPS_DATABASE[crop_name]
    assert crop.drought_tolerance == tolerance
    ph = (crop.ph_optimal_min + crop.ph_optimal_max) / 2.0
    s_wet = calculate_suitability_score(crop, make_soil(ph=ph), make_climate(soil_moisture_pct=50.0))
    s_dry = calculate_suitability_score(crop, make_soil(ph=ph), make_climate(soil_moisture_pct=20.0))
    if tolerance in ("scazuta", "medie"):
        assert s_dry < s_wet
    else:  # ridicata -> penalizare mică (×0.94), dar tot o reducere
        assert s_dry <= s_wet


def test_bonitate_minima_se_limiteaza_la_10():
    crop = CROPS_DATABASE["Porumb"]
    soil = make_soil(bonitate_points=1, ph=3.2, humus_pct=0.0, erosion_grade="puternic")
    score = calculate_suitability_score(crop, soil, make_climate(soil_moisture_pct=10.0))
    assert score == 10


def test_bonitate_maxima_se_limiteaza_la_98():
    crop = CROPS_DATABASE["Orz de toamna"]  # optim 6.2-8.0
    soil = make_soil(bonitate_points=100, ph=7.0, humus_pct=5.0, erosion_grade="lipsa")
    score = calculate_suitability_score(crop, soil, make_climate(soil_moisture_pct=55.0))
    assert score == 98
