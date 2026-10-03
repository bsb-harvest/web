"""
Teste unitare și de integrare pentru Task 3.1: Extragerea și Ingestia Datelor Pedologice (soluri.gov.md).
Responsabilitate: Persoana 3 (Data Engineer & Integration Specialist)
Acoperire:
1. Curățarea și normalizarea datelor pedologice (clean_soil_record)
2. Intersecția spațială punct-în-poligon cu Shapely (extract_soil_profile_by_coordinates)
3. Mecanismele de fallback (regional pe latitudini, default, și fallback WFS -> GeoJSON local)
4. Transformarea geometriilor și pregătirea recordurilor PostGIS (import_soils)
5. Integrarea cu spatial_matcher
"""

import pytest
from unittest.mock import patch, MagicMock
from shapely.geometry import Polygon, MultiPolygon
from shapely import wkt

from app.models.schemas import SoilProfile
from app.data_pipeline.soluri_extractor import (
    clean_soil_record,
    extract_soil_profile_by_coordinates,
    get_soil_features,
    load_seed_soil_features,
    fetch_wfs_soil_features,
    get_spatial_soil_polygons,
    PEDOLOGICAL_DEFAULTS,
    GENERAL_PEDOLOGICAL_DEFAULT,
    MOLDOVA_SOIL_REGIONS
)
from app.data_pipeline.import_soils import (
    parse_geojson_to_multipolygon_wkt,
    prepare_soil_record_dict,
)
from app.data_pipeline.spatial_matcher import match_parcel_environment


# ============================================================================
# 1. TESTE PENTRU CURĂȚAREA ȘI NORMALIZAREA DATELOR (clean_soil_record)
# ============================================================================

class TestSoilDataCleaning:
    """Verifică funcția clean_soil_record conform cerințelor de afaceri."""

    def test_clean_soil_fills_missing_ph_and_humus_cernoziom_levigat(self):
        """Completează valorile lipsă de pH și humus pentru Cernoziom levigat Bălți/Nord."""
        raw = {
            "soil_type": "Cernoziom levigat Bălți/Nord",
            "bonitate_points": 84,
            "ph": None,
            "humus_pct": None,
            "erosion_grade": "slab"
        }
        cleaned = clean_soil_record(raw)
        assert cleaned["ph"] == 6.8
        assert cleaned["humus_pct"] == 4.2
        assert cleaned["bonitate_points"] == 84
        assert cleaned["erosion_grade"] == "slab"

    def test_clean_soil_fills_missing_ph_and_humus_cernoziom_tipic(self):
        """Completează valorile lipsă pentru Cernoziom tipic Chișinău/Centru."""
        raw = {
            "soil_type": "Cernoziom tipic Chișinău/Centru",
            "bonitate_points": None,
            "ph": "",
            "humus_pct": None,
        }
        cleaned = clean_soil_record(raw)
        assert cleaned["ph"] == 7.2
        assert cleaned["humus_pct"] == 3.8
        assert cleaned["bonitate_points"] == 76
        assert cleaned["erosion_grade"] == "slab"

    def test_clean_soil_fills_missing_ph_and_humus_soluri_cenusii(self):
        """Completează valorile lipsă pentru Soluri cenușii Codru/Orhei."""
        raw = {
            "soil_type": "Soluri cenușii de pădure Codru",
            "bonitate_points": 60,
        }
        cleaned = clean_soil_record(raw)
        assert cleaned["ph"] == 6.2
        assert cleaned["humus_pct"] == 2.9
        assert cleaned["erosion_grade"] == "moderat"

    def test_clean_soil_fills_missing_ph_and_humus_cernoziom_carbonatic(self):
        """Completează valorile lipsă pentru Cernoziom carbonatic Cahul/Sud."""
        raw = {
            "soil_type": "Cernoziom carbonatic Cahul/Sud",
        }
        cleaned = clean_soil_record(raw)
        assert cleaned["ph"] == 7.8
        assert cleaned["humus_pct"] == 3.1
        assert cleaned["bonitate_points"] == 68
        assert cleaned["erosion_grade"] == "moderat"

    def test_clean_soil_fills_missing_ph_and_humus_soluri_aluviale(self):
        """Completează valorile lipsă pentru Soluri aluviale de luncă."""
        raw = {
            "soil_type": "Soluri aluviale de luncă Prut/Nistru",
        }
        cleaned = clean_soil_record(raw)
        assert cleaned["ph"] == 7.4
        assert cleaned["humus_pct"] == 3.2
        assert cleaned["bonitate_points"] == 70
        assert cleaned["erosion_grade"] == "lipsa"

    def test_bonitate_clamping_upper_and_lower_bounds(self):
        """Validează clamping-ul notei de bonitate între 1 și 100 puncte."""
        # Peste 100
        data_over = {"soil_type": "Cernoziom tipic", "bonitate_points": 150}
        assert clean_soil_record(data_over)["bonitate_points"] == 100

        # Sub 1
        data_under = {"soil_type": "Cernoziom tipic", "bonitate_points": -20}
        assert clean_soil_record(data_under)["bonitate_points"] == 1

        # Zero
        data_zero = {"soil_type": "Cernoziom tipic", "bonitate_points": 0}
        assert clean_soil_record(data_zero)["bonitate_points"] == 1

        # Valoare validă
        data_valid = {"soil_type": "Cernoziom tipic", "bonitate_points": 88}
        assert clean_soil_record(data_valid)["bonitate_points"] == 88

    def test_erosion_grade_normalization(self):
        """Normalizează diverse etichete și sinonime de eroziune la cele 4 valori permise."""
        # Lipsa
        for val in ["lipsa", "lipsă", "fara", "fără", "neerodat", "none", "0"]:
            res = clean_soil_record({"soil_type": "Cernoziom tipic", "erosion_grade": val})
            assert res["erosion_grade"] == "lipsa", f"Eșec pentru valoarea '{val}'"

        # Slab
        for val in ["slab", "slaba", "redus", "usor", "mic", "1"]:
            res = clean_soil_record({"soil_type": "Cernoziom tipic", "erosion_grade": val})
            assert res["erosion_grade"] == "slab", f"Eșec pentru valoarea '{val}'"

        # Moderat
        for val in ["moderat", "moderata", "mediu", "medie", "2"]:
            res = clean_soil_record({"soil_type": "Cernoziom tipic", "erosion_grade": val})
            assert res["erosion_grade"] == "moderat", f"Eșec pentru valoarea '{val}'"

        # Puternic
        for val in ["puternic", "puternica", "sever", "severa", "avansat", "ridicat", "3"]:
            res = clean_soil_record({"soil_type": "Cernoziom tipic", "erosion_grade": val})
            assert res["erosion_grade"] == "puternic", f"Eșec pentru valoarea '{val}'"

    def test_unknown_soil_type_fallback_to_general(self):
        """Pentru tipuri necunoscute de sol, se aplică valorile implicite pedologice generale."""
        data_unknown = {"soil_type": "Sol exotic necunoscut"}
        cleaned = clean_soil_record(data_unknown)
        assert cleaned["bonitate_points"] == 70
        assert cleaned["humus_pct"] == 3.5
        assert cleaned["ph"] == 7.0
        assert cleaned["erosion_grade"] == "slab"


# ============================================================================
# 2. TESTE PENTRU INTERSECȚIA SPAȚIALĂ PUNCT-ÎN-POLIGON
# ============================================================================

class TestSpatialIntersectionPointInPolygon:
    """Verifică identificarea precisă a solului prin Shapely Point-in-Polygon."""

    def test_chisinau_coordinates_matches_cernoziom_tipic(self):
        """Chișinău (lat=47.0105, lng=28.8350) trebuie să fie Cernoziom tipic Chișinău/Centru."""
        profile = extract_soil_profile_by_coordinates(47.0105, 28.8350)
        assert "Chișinău" in profile.type or "tipic" in profile.type
        assert profile.bonitate_points == 76
        assert profile.ph == 7.2
        assert profile.humus_pct == 3.8
        assert profile.erosion_grade == "slab"

    def test_balti_coordinates_matches_cernoziom_levigat(self):
        """Bălți (lat=47.7617, lng=27.9289) trebuie să fie Cernoziom levigat Bălți/Nord."""
        profile = extract_soil_profile_by_coordinates(47.7617, 27.9289)
        assert "levigat" in profile.type.lower() or "bălți" in profile.type.lower()
        assert profile.bonitate_points == 84
        assert profile.ph == 6.8
        assert profile.humus_pct == 4.2
        assert profile.erosion_grade == "slab"

    def test_orhei_coordinates_matches_soluri_cenusii(self):
        """Orhei Codru (lat=47.3831, lng=28.8231) trebuie să fie Soluri cenușii Codru/Orhei."""
        profile = extract_soil_profile_by_coordinates(47.3831, 28.8231)
        assert "cenușii" in profile.type.lower() or "cenusii" in profile.type.lower()
        assert profile.bonitate_points == 62
        assert profile.ph == 6.2
        assert profile.humus_pct == 2.9
        assert profile.erosion_grade == "moderat"

    def test_cahul_coordinates_matches_cernoziom_carbonatic(self):
        """Cahul Sud (lat=45.9075, lng=28.1944) trebuie să fie Cernoziom carbonatic Cahul/Sud."""
        profile = extract_soil_profile_by_coordinates(45.9075, 28.1944)
        assert "carbonatic" in profile.type.lower() or "cahul" in profile.type.lower()
        assert profile.bonitate_points == 68
        assert profile.ph == 7.8
        assert profile.humus_pct == 3.1
        assert profile.erosion_grade == "moderat"

    def test_lunca_nistrului_coordinates_matches_soluri_aluviale(self):
        """Lunca Nistrului (lat=46.65, lng=29.65) trebuie să fie Soluri aluviale de luncă."""
        profile = extract_soil_profile_by_coordinates(46.65, 29.65)
        assert "aluviale" in profile.type.lower() or "luncă" in profile.type.lower()
        assert profile.bonitate_points == 70
        assert profile.ph == 7.4
        assert profile.humus_pct == 3.2
        assert profile.erosion_grade == "lipsa"

    def test_lunca_prutului_coordinates_matches_soluri_aluviale(self):
        """Lunca Prutului (lat=47.30, lng=27.80) trebuie să fie Soluri aluviale de luncă."""
        profile = extract_soil_profile_by_coordinates(47.30, 27.80)
        assert "aluviale" in profile.type.lower() or "luncă" in profile.type.lower()
        assert profile.bonitate_points == 70
        assert profile.ph == 7.4
        assert profile.erosion_grade == "lipsa"


# ============================================================================
# 3. TESTE PENTRU MECANISMELE DE FALLBACK
# ============================================================================

class TestSoilFallbacks:
    """Verifică scenariile de fallback regional, implicit și Geoserver WFS."""

    def test_fallback_regional_when_point_outside_seed_polygons(self):
        """
        Un punct din Moldova dar în afara poligoanelor seed (ex: lat=48.40, lng=26.50)
        trebuie să folosească fallback-ul regional pe latitudini.
        """
        # Punct în nordul extrem la vest de poligonul seed
        profile_nord = extract_soil_profile_by_coordinates(48.20, 26.65)
        assert "levigat" in profile_nord.type.lower()
        assert profile_nord.bonitate_points == 84

        # Punct în sud la est de poligonul seed
        profile_sud = extract_soil_profile_by_coordinates(46.00, 29.10)
        assert "carbonatic" in profile_sud.type.lower()
        assert profile_sud.bonitate_points == 68

    def test_fallback_default_when_point_outside_moldova(self):
        """Un punct la coordonate complet în afara Moldovei folosește fallback-ul central implicit."""
        profile = extract_soil_profile_by_coordinates(52.5200, 13.4050)  # Berlin
        assert "Cernoziom tipic moderat humifer" in profile.type
        assert profile.bonitate_points == 76
        assert profile.ph == 7.2
        assert profile.humus_pct == 3.8

    def test_wfs_fallback_to_local_geojson_on_network_error(self):
        """Când WFS Geoserver eșuează, extractorul trece pe fișierul seed GeoJSON local."""
        with patch("httpx.Client.get", side_effect=Exception("WFS Server Timeout")):
            features = get_soil_features(force_fallback=False)
            assert len(features) >= 5
            soil_types = [f["properties"]["soil_type"] for f in features]
            assert any("levigat" in st.lower() for st in soil_types)
            assert any("cenușii" in st.lower() or "cenusii" in st.lower() for st in soil_types)
            assert any("carbonatic" in st.lower() for st in soil_types)


# ============================================================================
# 4. TESTE PENTRU SCRIPTUL ETL (import_soils.py & Shapely parsing)
# ============================================================================

class TestImportSoilsETL:
    """Verifică parsarea Shapely MultiPolygon și pregătirea recordurilor PostGIS."""

    def test_parse_geojson_polygon_to_multipolygon_wkt(self):
        """Convertește corect un Polygon GeoJSON în Shapely MultiPolygon și text WKT."""
        sample_poly_geom = {
            "type": "Polygon",
            "coordinates": [
                [
                    [28.0, 47.0],
                    [29.0, 47.0],
                    [29.0, 48.0],
                    [28.0, 48.0],
                    [28.0, 47.0]
                ]
            ]
        }
        multi_geom, wkt_str = parse_geojson_to_multipolygon_wkt(sample_poly_geom)
        assert isinstance(multi_geom, MultiPolygon)
        assert wkt_str.startswith("MULTIPOLYGON")
        assert not multi_geom.is_empty
        assert multi_geom.is_valid

    def test_parse_geojson_multipolygon_wkt(self):
        """Păstrează un MultiPolygon GeoJSON existent."""
        sample_multipoly_geom = {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [28.0, 47.0],
                        [29.0, 47.0],
                        [29.0, 47.5],
                        [28.0, 47.5],
                        [28.0, 47.0]
                    ]
                ]
            ]
        }
        multi_geom, wkt_str = parse_geojson_to_multipolygon_wkt(sample_multipoly_geom)
        assert isinstance(multi_geom, MultiPolygon)
        assert wkt_str.startswith("MULTIPOLYGON")

    def test_prepare_soil_record_dict_all_seed_features(self):
        """Verifică că toate entitățile din fișierul seed pot fi pregătite pentru DB fără erori."""
        seed_features = load_seed_soil_features()
        assert len(seed_features) == 5

        for feat in seed_features:
            rec = prepare_soil_record_dict(feat, force_wkt=True)
            assert "soil_type" in rec
            assert 1 <= rec["bonitate_score"] <= 100
            assert 3.0 <= float(rec["ph_level"]) <= 10.0
            assert float(rec["humus_percentage"]) > 0.0
            assert rec["erosion_grade"] in ["lipsa", "slab", "moderat", "puternic"]
            assert rec["geom_wkt"].startswith("MULTIPOLYGON")


# ============================================================================
# 5. TEST INTEGRARE CU SPATIAL MATCHER
# ============================================================================

class TestSpatialMatcherIntegration:
    """Verifică integrarea între matching-ul de mediu al parcelei și profilul de sol."""

    def test_match_parcel_environment_resolves_soil_profile(self):
        """O parcelă desenată în Chișinău trebuie să primească profilul de sol corect."""
        chisinau_parcel_coords = [
            [28.82, 47.00],
            [28.85, 47.00],
            [28.85, 47.02],
            [28.82, 47.02],
            [28.82, 47.00]
        ]
        soil, climate, area_ha = match_parcel_environment(chisinau_parcel_coords)
        assert isinstance(soil, SoilProfile)
        assert "Chișinău" in soil.type or "tipic" in soil.type
        assert soil.bonitate_points == 76
        assert area_ha > 0
        assert climate.nearest_station_id is not None
