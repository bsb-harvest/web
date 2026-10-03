"""
Teste unitare pentru motorul agronomic și financiar determinist.
Persoana 4: Agronomic & Financial Logic Engineer
Task 4.5: Pytest cu verificare 100% a algoritmilor deterministi.
"""

import pytest
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CROPS_DATABASE
from app.agronomic_engine.suitability import calculate_suitability_score
from app.agronomic_engine.yield_calculator import calculate_crop_yield
from app.agronomic_engine.financial_engine import calculate_crop_finances
from app.agronomic_engine.calculator import calculate_crop_economics


@pytest.fixture
def sample_soil():
    return SoilProfile(
        type="Cernoziom tipic moderat humifer",
        bonitate_points=76,
        humus_pct=3.8,
        ph=7.2,
        erosion_grade="slab"
    )


@pytest.fixture
def sample_climate():
    return ClimateTelemetry(
        nearest_station_id="agro-st-chisinau-01",
        distance_km=4.2,
        soil_moisture_pct=42.0,
        leaf_wetness_hours=3.5,
        precipitation_last_30d_mm=28.0,
        eto_evapotranspiration_mm=4.5
    )


def test_crops_database_contains_six_crops():
    assert len(CROPS_DATABASE) == 6
    assert "Floarea-soarelui" in CROPS_DATABASE
    assert "Grau de toamna" in CROPS_DATABASE
    assert "Porumb" in CROPS_DATABASE
    assert "Rapita" in CROPS_DATABASE
    assert "Soia" in CROPS_DATABASE
    assert "Orz de toamna" in CROPS_DATABASE


def test_suitability_score_bounds(sample_soil, sample_climate):
    crop = CROPS_DATABASE["Floarea-soarelui"]
    score = calculate_suitability_score(crop, sample_soil, sample_climate)
    assert 10 <= score <= 98
    assert score > 70  # Pe cernoziom cu bonitate 76, floarea-soarelui este foarte potrivită


def test_yield_calculator(sample_soil, sample_climate):
    crop = CROPS_DATABASE["Grau de toamna"]
    yield_est = calculate_crop_yield(crop, sample_soil, sample_climate)
    assert yield_est.min_t_ha > 0.5
    assert yield_est.max_t_ha > yield_est.min_t_ha
    assert 3.0 <= yield_est.min_t_ha <= 6.5


def test_financial_engine_profit_calculation(sample_soil, sample_climate):
    crop = CROPS_DATABASE["Floarea-soarelui"]
    yield_est = calculate_crop_yield(crop, sample_soil, sample_climate)
    breakdown, total_cost, revenue, net_profit = calculate_crop_finances(
        crop, sample_soil, sample_climate, yield_est
    )
    
    assert total_cost > 0
    assert revenue > 0
    assert breakdown.seeds_mdl > 0
    assert breakdown.fertilizers_mdl > 0
    assert breakdown.fuel_diesel_mdl > 0
    # Profitul net este diferenta dintre venit si cheltuieli
    assert round(revenue - total_cost, 2) == round(net_profit, 2)


def test_calculate_crop_economics_all_crops(sample_soil, sample_climate):
    results = calculate_crop_economics(sample_soil, sample_climate)
    assert len(results) == 6
    # Rezultatele trebuie sa fie sortate dupa scorul de potrivire si profit
    for i in range(len(results) - 1):
        assert results[i].suitability_score >= results[i+1].suitability_score or results[i].net_profit_mdl_ha >= results[i+1].net_profit_mdl_ha
