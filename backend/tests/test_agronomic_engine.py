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
from app.agronomic_engine.financial_engine import calculate_crop_finances, calculate_crop_financials
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
    # Semantica noua (Task 4.2): min = scenariu an secetos, max = scenariu an optim
    assert yield_est.max_t_ha > yield_est.min_t_ha
    # Anul secetos (precipitatii x0.5, ETo x1.2) reduce semnificativ productia de grau
    assert 1.0 <= yield_est.min_t_ha <= 3.5
    # Anul optim (fara deficit hidric/termic) ramane in banda realista pentru grau de toamna
    assert 4.0 <= yield_est.max_t_ha <= 6.5


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


def test_calculate_crop_economics_strict_sort_order(sample_soil, sample_climate):
    # Ordinea trebuie sa respecte STRICT cheia folosita de calculate_crop_economics:
    # descrescator dupa (suitability_score, net_profit_mdl_ha)
    results = calculate_crop_economics(sample_soil, sample_climate)
    keys = [(r.suitability_score, r.net_profit_mdl_ha) for r in results]
    assert keys == sorted(keys, reverse=True)


def test_calculate_crop_economics_populates_financial_fields(sample_soil, sample_climate):
    results = calculate_crop_economics(sample_soil, sample_climate)
    for rc in results:
        assert rc.break_even_yield_t_ha is not None
        assert rc.net_profit_min_mdl_ha is not None
        assert rc.net_profit_max_mdl_ha is not None
        assert rc.margin_min_pct is not None
        assert rc.margin_max_pct is not None
        # profitul mediu expus trebuie sa fie intre scenariul minim si maxim
        assert rc.net_profit_min_mdl_ha <= rc.net_profit_mdl_ha <= rc.net_profit_max_mdl_ha

    # coerenta cu financiarul calculat direct, pentru o cultura
    crop = CROPS_DATABASE["Floarea-soarelui"]
    y = calculate_crop_yield(crop, sample_soil, sample_climate)
    fin = calculate_crop_financials(crop, sample_soil, sample_climate, y)
    fs = next(r for r in results if r.crop_name == "Floarea-soarelui")
    assert fs.break_even_yield_t_ha == fin.break_even_yield_t_ha
    assert fs.net_profit_min_mdl_ha == fin.net_profit_min_mdl_ha
    assert fs.net_profit_max_mdl_ha == fin.net_profit_max_mdl_ha
    assert fs.margin_min_pct == fin.margin_min_pct
    assert fs.margin_max_pct == fin.margin_max_pct


def test_calculate_crop_economics_selected_crops_by_name(sample_soil, sample_climate):
    results = calculate_crop_economics(sample_soil, sample_climate, selected_crops=["Soia"])
    assert len(results) == 1
    assert results[0].crop_name == "Soia"


def test_calculate_crop_economics_selected_crops_by_latin_name(sample_soil, sample_climate):
    results = calculate_crop_economics(sample_soil, sample_climate, selected_crops=["Glycine max"])
    assert len(results) == 1
    assert results[0].crop_name == "Soia"


def test_calculate_crop_economics_nonexistent_crop_returns_empty(sample_soil, sample_climate):
    results = calculate_crop_economics(sample_soil, sample_climate, selected_crops=["Cultura-Inexistenta"])
    assert results == []
