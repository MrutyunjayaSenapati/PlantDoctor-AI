from unittest.mock import patch
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.db.models import User


@pytest.mark.asyncio
async def test_upload_image_success(client: AsyncClient):
    mock_profile = {
        "google_id": "uploader_google_id",
        "email": "uploader@example.com",
        "name": "Uploader User",
        "avatar_url": "",
    }

    with patch("app.api.auth.verify_google_token", return_value=mock_profile):
        login_res = await client.post("/api/v1/auth/google", json={"idToken": "tok"})
        token = login_res.json()["accessToken"]

    with patch("app.api.upload.upload_image_bytes", return_value="https://res.cloudinary.com/test/image.jpg"):
        files = {"image": ("test.jpg", b"fake image bytes", "image/jpeg")}
        response = await client.post(
            "/api/v1/upload",
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json() == {"imageUrl": "https://res.cloudinary.com/test/image.jpg"}


@pytest.mark.asyncio
async def test_upload_image_invalid_mimetype(client: AsyncClient):
    mock_profile = {
        "google_id": "uploader_google_id_2",
        "email": "uploader2@example.com",
        "name": "Uploader User 2",
        "avatar_url": "",
    }

    with patch("app.api.auth.verify_google_token", return_value=mock_profile):
        login_res = await client.post("/api/v1/auth/google", json={"idToken": "tok"})
        token = login_res.json()["accessToken"]

    files = {"image": ("test.txt", b"text content", "text/plain")}
    response = await client.post(
        "/api/v1/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert response.json()["success"] is False
