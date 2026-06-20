import json
import logging

from google import genai
from google.genai import types

from app.config import settings
from app.schemas.diagnosis import DiagnosisResponse, compute_status
from app.services.diagnosis_provider import DiagnosisProvider

logger = logging.getLogger(__name__)

PROMPT = """Analyze this plant image and return ONLY valid JSON. No markdown, no explanation.

{
  "plant": "common name of the plant",
  "disease": "name of the disease or 'Healthy' if none",
  "confidence": 0.0 to 1.0,
  "explanation": "brief clinical description of symptoms seen",
  "treatment": ["step 1", "step 2", "step 3"]
}
"""


class GeminiProvider(DiagnosisProvider):
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.0-flash"

    async def analyze(self, image_bytes: bytes) -> DiagnosisResponse:
        logger.info("Sending image to Gemini Vision...")

        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        response = self.client.models.generate_content(
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
