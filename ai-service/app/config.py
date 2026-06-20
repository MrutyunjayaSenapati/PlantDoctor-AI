import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openrouter")
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()
