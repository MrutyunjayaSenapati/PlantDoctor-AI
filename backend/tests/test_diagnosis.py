from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient
from app.schemas.diagnosis import DiagnosisResponse


@pytest.mark.asyncio
async def test_diagnosis_flow_history_and_stats(client: AsyncClient):
    # 1. Login user
    mock_profile = {
        "google_id": "diag_user_1",
        "email": "diag@example.com",
        "name": "Diagnosis User",
        "avatar_url": "",
    }
    with patch("app.api.auth.verify_google_token", return_value=mock_profile):
        res = await client.post("/api/v1/auth/google", json={"idToken": "token"})
        token = res.json()["accessToken"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Mock image bytes fetch and AI provider analysis
    fake_ai_response = DiagnosisResponse(
        plant="Tomato",
        disease="Early Blight",
        confidence=0.95,
        status="HIGH_CONFIDENCE",
        explanation="Dark spots with concentric rings seen on lower leaves.",
        treatment=["Remove infected leaves", "Apply copper fungicide"],
    )

    mock_provider = AsyncMock()
    mock_provider.analyze.return_value = fake_ai_response

    with patch("app.services.diagnosis.fetch_image_bytes", return_value=b"fake_image_bytes"), \
         patch("app.services.diagnosis.get_provider", return_value=mock_provider):

        # POST /api/v1/diagnosis
        diag_res = await client.post(
            "/api/v1/diagnosis",
            json={"imageUrl": "https://res.cloudinary.com/test/plant.jpg"},
            headers=headers,
        )
        assert diag_res.status_code == 200
        data = diag_res.json()
        assert data["plant"] == "Tomato"
        assert data["disease"] == "Early Blight"
        assert data["confidence"] == 0.95
        assert data["status"] == "HIGH_CONFIDENCE"
        assert "diagnosisId" in data
        diagnosis_id = data["diagnosisId"]

        # GET /api/v1/diagnosis/stats
        stats_res = await client.get("/api/v1/diagnosis/stats", headers=headers)
        assert stats_res.status_code == 200
        assert stats_res.json() == {"success": True, "totalScans": 1}

        # GET /api/v1/diagnosis/history
        hist_res = await client.get("/api/v1/diagnosis/history?page=1&limit=10", headers=headers)
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert hist_data["success"] is True
        assert hist_data["total"] == 1
        assert len(hist_data["items"]) == 1
        assert hist_data["items"][0]["id"] == diagnosis_id
        assert hist_data["items"][0]["plantName"] == "Tomato"
