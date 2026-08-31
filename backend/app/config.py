import os
from typing import List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = 3001
    DATABASE_URL: str = "postgresql+asyncpg://plantdoc:plantdoc@localhost:5432/plantdoc"
    JWT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-001"
    AI_PROVIDER: str = "openrouter"

    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if not v:
            return v
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        if "sslmode=" in v:
            v = v.replace("sslmode=require", "ssl=require").replace("sslmode=prefer", "ssl=prefer").replace("sslmode=disable", "ssl=disable")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, v: str) -> str:
        allowed = {"gemini", "openrouter", "local"}
        val = v.lower().strip()
        if val not in allowed:
            raise ValueError(f"AI_PROVIDER must be one of {allowed}, got '{v}'")
        return val

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        # Fail-fast check on JWT_SECRET if running in production or standard mode
        if not self.JWT_SECRET or self.JWT_SECRET == "change-me-secret-key":
            # For testing/dev fallback if empty
            if os.getenv("TESTING") == "1":
                self.JWT_SECRET = "test-secret-key-at-least-32-chars-long"
            else:
                raise ValueError("JWT_SECRET environment variable is missing or insecure")
        return self


settings = Settings()
