import logging
from google.auth.transport import requests
from google.oauth2 import id_token
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


def verify_google_token(token: str) -> dict:
    try:
        req = requests.Request()
        audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        payload = id_token.verify_oauth2_token(token, req, audience=audience)

        if not payload or "sub" not in payload:
            raise ValueError("Token missing sub claim")

        return {
            "google_id": payload["sub"],
            "email": payload.get("email", ""),
            "name": payload.get("name", ""),
            "avatar_url": payload.get("picture", ""),
        }
    except Exception as e:
        logger.error("Google token verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )
