"""
Teste de integrare pentru endpoint-urile FastAPI.
Persoana 2: Backend Core & Database Engineer
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "mock_contract" in data


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_mock_contract_endpoint():
    response = client.get("/api/v1/mock/contract")
    assert response.status_code == 200
    data = response.json()
    assert "parcel_id" in data
    assert "soil_profile" in data
    assert "climate_telemetry" in data
    assert "recommended_crops" in data
    assert "ai_guidance" in data


def test_analyze_parcel_full_pipeline():
    payload = {
        "cadastral_code": "0100234567",
        "coordinates": [
            [28.83, 47.01],
            [28.85, 47.01],
            [28.85, 47.03],
            [28.83, 47.03]
        ]
    }
    response = client.post("/api/v1/parcels/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["cadastral_code"] == "0100234567"
    assert data["area_ha"] > 0
    assert len(data["recommended_crops"]) >= 1
    assert "summary" in data["ai_guidance"]
