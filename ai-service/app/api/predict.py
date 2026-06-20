import logging

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.config import settings
from app.schemas.diagnosis import DiagnosisResponse
from app.services.diagnosis_provider import DiagnosisProvider
from app.services.gemini_provider import GeminiProvider
from app.services.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

router = APIRouter()

_provider: DiagnosisProvider | None = None


def get_provider() -> DiagnosisProvider:
    global _provider
    if _provider is None:
        if settings.AI_PROVIDER == "gemini":
            logger.info("Initializing GeminiProvider...")
            _provider = GeminiProvider()
        elif settings.AI_PROVIDER == "openrouter":
            logger.info("Initializing OpenRouterProvider...")
            _provider = OpenRouterProvider()
        else:
            raise RuntimeError(f"Unknown AI_PROVIDER: {settings.AI_PROVIDER}")
    return _provider


@router.post("/predict", response_model=DiagnosisResponse)
async def predict(image: UploadFile = File(...)) -> DiagnosisResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="File must be an image")

    image_bytes = await image.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=422, detail="Empty image file")

    logger.info(
        "Predict request — file: %s, size: %d bytes",
        image.filename,
        len(image_bytes),
    )

    try:
        provider = get_provider()
        result = await provider.analyze(image_bytes)
        logger.info("Prediction complete — plant: %s, disease: %s", result.plant, result.disease)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Prediction failed: %s", str(e))
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
