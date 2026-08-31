from app.schemas.diagnosis import DiagnosisResponse
from app.services.ai.base import DiagnosisProvider


class LocalProvider(DiagnosisProvider):
    async def analyze(self, image_bytes: bytes) -> DiagnosisResponse:
        raise NotImplementedError("Local PyTorch model provider is not yet implemented.")
