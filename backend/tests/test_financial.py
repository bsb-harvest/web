"""
Teste unitare pentru modulul financiar (financial_engine.py).
Persoana 4 — Task 4.4: acoperire completă (categorii de cost, prag de rentabilitate, marje).
"""

import pytest
from app.models.schemas import SoilProfile, ClimateTelemetry
from app.agronomic_engine.crops_database import CROPS_DATABASE
from app.agronomic_engine.yield_calculator import calculate_crop_yield
from app.agronomic_engine.financial_engine import (
    build_cost_breakdown,
    calculate_crop_finances,
    calculate_crop_financials,
)

CROP_NAMES = list(CROPS_DATABASE.keys())


def make_soil(**kw):
    base = dict(type="Cernoziom", bonitate_points=76, humus_pct=3.0, ph=7.0, erosion_grade="slab")
    base.update(kw)
    return SoilProfile(**base)


def make_climate(**kw):
    base = dict(
        nearest_station_id="st", distance_km=4.2, soil_moisture_pct=42.0,
        leaf_wetness_hours=3.5, precipitation_last_30d_mm=28.0, eto_evapotranspiration_mm=4.5,
    )
    base.update(kw)
    return ClimateTelemetry(**base)


def test_humus_low_increases_fertilizer():
    crop = CROPS_DATABASE["Grau de toamna"]
    bd_low, _ = build_cost_breakdown(crop, make_soil(humus_pct=2.0), make_climate())
    bd_mid, _ = build_cost_breakdown(crop, make_soil(humus_pct=3.0), make_climate())
    assert bd_low.fertilizers_mdl == round(crop.base_fertilizer_cost_mdl * 1.20, 2)
    assert bd_low.fertilizers_mdl > bd_mid.fertilizers_mdl


def test_humus_high_reduces_fertilizer():
    crop = CROPS_DATABASE["Grau de toamna"]
    bd_hi, _ = build_cost_breakdown(crop, make_soil(humus_pct=4.0), make_climate())
    assert bd_hi.fertilizers_mdl == round(crop.base_fertilizer_cost_mdl * 0.90, 2)


@pytest.mark.parametrize("grade", ["moderat", "puternic"])
def test_erosion_increases_fuel(grade):
    crop = CROPS_DATABASE["Porumb"]
    bd, _ = build_cost_breakdown(crop, make_soil(erosion_grade=grade), make_climate())
    assert bd.fuel_diesel_mdl == round(crop.base_fuel_cost_mdl * 1.15, 2)


def test_high_leaf_wetness_increases_pesticides():
    crop = CROPS_DATABASE["Rapita"]
    bd, _ = build_cost_breakdown(crop, make_soil(), make_climate(leaf_wetness_hours=6.0))
    assert bd.pesticides_mdl == round(crop.base_pesticide_cost_mdl * 1.25, 2)


def test_total_cost_is_sum_of_categories():
    crop = CROPS_DATABASE["Floarea-soarelui"]
    bd, total = build_cost_breakdown(crop, make_soil(), make_climate())
    assert total == round(
        bd.seeds_mdl + bd.fertilizers_mdl + bd.fuel_diesel_mdl
        + bd.pesticides_mdl + bd.mechanized_labor_mdl, 2
    )
    assert bd.total_cost_mdl == total


@pytest.mark.parametrize("crop_name", CROP_NAMES)
def test_full_financials_break_even_and_margins(crop_name):
    crop = CROPS_DATABASE[crop_name]
    soil, clim = make_soil(), make_climate()
    y = calculate_crop_yield(crop, soil, clim)
    f = calculate_crop_financials(crop, soil, clim, y)

    # Prag de rentabilitate (t/ha) = cost total / preț piață
    assert f.break_even_yield_t_ha == round(f.total_cost_mdl_ha / crop.market_price_mdl_per_ton, 2)

    # Ordinea venitului/profitului pe scenarii
    assert f.revenue_min_mdl_ha <= f.revenue_avg_mdl_ha <= f.revenue_max_mdl_ha
    assert f.net_profit_min_mdl_ha <= f.net_profit_avg_mdl_ha <= f.net_profit_max_mdl_ha

    # Marja (%) coerentă cu profit/venit
    if f.revenue_max_mdl_ha > 0:
        assert f.margin_max_pct == round(f.net_profit_max_mdl_ha / f.revenue_max_mdl_ha * 100, 2)
    if f.revenue_min_mdl_ha > 0:
        assert f.margin_min_pct == round(f.net_profit_min_mdl_ha / f.revenue_min_mdl_ha * 100, 2)

    # Proveniența prețului este atașată și marcată ca neverificată (estimare)
    assert f.price_reference.verified is False
    assert f.price_reference.source


def test_full_financials_avg_matches_compat_function():
    crop = CROPS_DATABASE["Floarea-soarelui"]
    soil, clim = make_soil(), make_climate()
    y = calculate_crop_yield(crop, soil, clim)
    _, total, revenue, net = calculate_crop_finances(crop, soil, clim, y)
    f = calculate_crop_financials(crop, soil, clim, y)
    assert f.total_cost_mdl_ha == total
    assert f.revenue_avg_mdl_ha == revenue
    assert f.net_profit_avg_mdl_ha == net
