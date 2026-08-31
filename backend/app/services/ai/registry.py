import logging
from app.config import settings
from app.services.ai.base import DiagnosisProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.local_provider import LocalProvider
from app.services.ai.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

_provider_instance: DiagnosisProvider | None = None


def get_provider() -> DiagnosisProvider:
    global _provider_instance
    if _provider_instance is None:
        provider_type = settings.AI_PROVIDER.lower()
        if provider_type == "gemini":
            logger.info("Initializing GeminiProvider...")
            _provider_instance = GeminiProvider()
        elif provider_type == "openrouter":
            logger.info("Initializing OpenRouterProvider...")
            _provider_instance = OpenRouterProvider()
        elif provider_type == "local":
            logger.info("Initializing LocalProvider...")
            _provider_instance = LocalProvider()
        else:
            raise RuntimeError(f"Unknown AI_PROVIDER: {settings.AI_PROVIDER}")
    return _provider_instance
