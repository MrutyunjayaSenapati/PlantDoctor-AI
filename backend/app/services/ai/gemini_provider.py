import asyncio
import json
import logging
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.diagnosis import DiagnosisResponse, compute_status
from app.services.ai.base import DiagnosisProvider

logger = logging.getLogger(__name__)

PROMPT = """Perform an expert botanical and phytopathological analysis of this plant image.

Instructions:
1. Examine leaf morphology carefully (leaflet arrangement, margin serration, trichomes, venation) to accurately identify the exact plant species (e.g., Potato vs Tomato vs Pepper).
2. Inspect visual disease symptoms, lesions, fungal spots, or discoloration.
3. Return ONLY valid JSON with no markdown wrapping or extra text.

{
  "plant": "exact common name of the plant (e.g., Potato, Tomato, Corn, Rose)",
  "disease": "name of the disease or 'Healthy' if none",
  "confidence": 0.0 to 1.0,
  "explanation": "clinical visual evidence supporting plant identification and disease diagnosis",
  "treatment": ["step 1", "step 2", "step 3"]
}
"""


class GeminiProvider(DiagnosisProvider):
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

    async def analyze(self, image_bytes: bytes) -> DiagnosisResponse:
        logger.info("Sending image to Gemini Vision...")

        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=self.model,
            contents=[PROMPT, image_part],
        )


        raw = response.text.strip()
        logger.info("Gemini response received (%d chars)", len(raw))

        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        data = json.loads(raw)

        confidence = float(data.get("confidence", 0.0))
        status = compute_status(confidence)

        return DiagnosisResponse(
            plant=str(data.get("plant", "")),
            disease=str(data.get("disease", "")),
            confidence=confidence,
            status=status,
            explanation=str(data.get("explanation", "")),
            treatment=[str(t) for t in data.get("treatment", [])],
        )
