from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient
from app.schemas.diagnosis import DiagnosisResponse


@pytest.mark.asyncio
async def test_feedback_flow(client: AsyncClient):
    # 1. Login user
    mock_profile = {
        "google_id": "fb_user_1",
        "email": "fb@example.com",
        "name": "Feedback User",
        "avatar_url": "",
    }
    with patch("app.api.auth.verify_google_token", return_value=mock_profile):
        res = await client.post("/api/v1/auth/google", json={"idToken": "token"})
        token = res.json()["accessToken"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create diagnosis
    fake_ai_response = DiagnosisResponse(
        plant="Rose",
        disease="Powdery Mildew",
        confidence=0.88,
        status="MEDIUM_CONFIDENCE",
        explanation="White powdery coating on leaves.",
        treatment=["Prune affected areas"],
    )

    mock_provider = AsyncMock()
    mock_provider.analyze.return_value = fake_ai_response

    with patch("app.services.diagnosis.fetch_image_bytes", return_value=b"fake_image_bytes"), \
         patch("app.services.diagnosis.get_provider", return_value=mock_provider):

        diag_res = await client.post(
            "/api/v1/diagnosis",
            json={"imageUrl": "https://res.cloudinary.com/test/rose.jpg"},
            headers=headers,
        )
        diagnosis_id = diag_res.json()["diagnosisId"]

    # 3. Submit feedback
    fb_res = await client.post(
        "/api/v1/feedback",
        json={
            "diagnosisId": diagnosis_id,
            "isCorrect": True,
            "comment": "Accurate diagnosis!",
        },
        headers=headers,
    )
    assert fb_res.status_code == 201
    fb_data = fb_res.json()
    assert fb_data["success"] is True
    assert fb_data["data"]["diagnosisId"] == diagnosis_id
    assert fb_data["data"]["isCorrect"] is True
    assert fb_data["data"]["comment"] == "Accurate diagnosis!"
