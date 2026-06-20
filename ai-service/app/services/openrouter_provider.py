import base64
import json
import logging

import httpx

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


class OpenRouterProvider(DiagnosisProvider):
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self) -> None:
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL

    async def analyze(self, image_bytes: bytes) -> DiagnosisResponse:
        logger.info("Sending image to OpenRouter (%s)...", self.model)

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{image_b64}"

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {"type": "image_url", "image_url": {"url": data_uri}},
                    ],
                }
            ],
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        raw = data["choices"][0]["message"]["content"].strip()
        logger.info("OpenRouter response received (%d chars)", len(raw))

        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        parsed = json.loads(raw)

        confidence = float(parsed.get("confidence", 0.0))
        status = compute_status(confidence)

        return DiagnosisResponse(
            plant=str(parsed.get("plant", "")),
            disease=str(parsed.get("disease", "")),
            confidence=confidence,
            status=status,
            explanation=str(parsed.get("explanation", "")),
            treatment=[str(t) for t in parsed.get("treatment", [])],
        )
