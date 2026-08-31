import asyncio
import json
import logging
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.diagnosis import DiagnosisResponse, compute_status
from app.services.ai.base import DiagnosisProvider

logger = logging.getLogger(__name__)

PROMPT = """Perform an expert botanical and phytopathological analysis of this image.
 
Instructions:
1. Plant Validation Gate: First check if the image clearly contains a plant, leaf, crop, flower, or agricultural vegetation.
   - If the image is NOT a plant (e.g. human face, pet, car, electronic device, furniture, clothing, shoe, screenshot, or solid background), you MUST return:
     {
       "plant": "Not a Plant",
       "disease": "No Plant Detected",
       "confidence": 0.0,
       "explanation": "The uploaded image does not appear to contain a plant, leaf, or crop. Please provide a clear, well-lit photo of a plant leaf.",
       "treatment": []
     }
2. Leaf & Species Identification: Examine leaf morphology carefully (leaflet arrangement, margin serration, trichomes, venation) to accurately identify the exact plant species (e.g., Potato, Tomato, Pepper, Corn, Rose).
3. Pathology & Symptoms: Inspect visual disease symptoms, lesions, fungal spots, chlorosis, or discoloration.
4. Return ONLY valid JSON with no markdown wrapping or extra text.

{
  "plant": "exact common name of the plant (e.g., Potato, Tomato, Corn, Rose) or 'Not a Plant'",
  "disease": "name of the disease, 'Healthy' if none, or 'No Plant Detected'",
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

        plant = str(data.get("plant", ""))
        confidence = float(data.get("confidence", 0.0))
        status = compute_status(confidence, plant=plant)

        return DiagnosisResponse(
            plant=plant,
            disease=str(data.get("disease", "")),
            confidence=confidence,
            status=status,
            explanation=str(data.get("explanation", "")),
            treatment=[str(t) for t in data.get("treatment", [])],
        )
