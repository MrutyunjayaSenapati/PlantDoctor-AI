from pydantic import BaseModel


class DiagnosisResponse(BaseModel):
    plant: str
    disease: str
    confidence: float
    status: str
    explanation: str
    treatment: list[str]


def compute_status(confidence: float) -> str:
    if confidence > 0.90:
        return "HIGH_CONFIDENCE"
    if confidence >= 0.70:
        return "MEDIUM_CONFIDENCE"
    return "LOW_CONFIDENCE"
