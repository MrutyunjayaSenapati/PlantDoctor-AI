from unittest.mock import patch
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_google_login(client: AsyncClient):
    mock_profile = {
        "google_id": "google_test_12345",
        "email": "test@example.com",
        "name": "Test User",
        "avatar_url": "https://example.com/avatar.jpg",
    }

    with patch("app.api.auth.verify_google_token", return_value=mock_profile):
        response = await client.post(
            "/api/v1/auth/google", json={"idToken": "fake_google_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"

        # Test /auth/me with generated token
        token = data["accessToken"]
        me_response = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_auth_register_and_login_flow(client: AsyncClient):
    # 1. Register new user
    reg_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "securePassword123",
        "confirmPassword": "securePassword123",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "accessToken" in reg_data
    assert reg_data["user"]["name"] == "Jane Doe"
    assert reg_data["user"]["email"] == "jane@example.com"

    # 2. Login with valid credentials
    login_payload = {
        "email": "jane@example.com",
        "password": "securePassword123",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "accessToken" in login_data
    assert login_data["user"]["email"] == "jane@example.com"


@pytest.mark.asyncio
async def test_auth_register_password_mismatch(client: AsyncClient):
    reg_payload = {
        "name": "Mismatch User",
        "email": "mismatch@example.com",
        "password": "password123",
        "confirmPassword": "differentPassword123",
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 400
    assert res.json()["message"] == "Passwords do not match"


@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient):
    # Register user first
    reg_payload = {
        "name": "Valid User",
        "email": "valid@example.com",
        "password": "correctPassword123",
        "confirmPassword": "correctPassword123",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Login with wrong password
    login_payload = {
        "email": "valid@example.com",
        "password": "wrongPassword123",
    }
    res = await client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
    assert res.json()["message"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_auth_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["success"] is False
