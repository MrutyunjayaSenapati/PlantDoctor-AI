from abc import ABC, abstractmethod

from app.schemas.diagnosis import DiagnosisResponse


class DiagnosisProvider(ABC):
    @abstractmethod
    async def analyze(self, image_bytes: bytes) -> DiagnosisResponse:
        ...
