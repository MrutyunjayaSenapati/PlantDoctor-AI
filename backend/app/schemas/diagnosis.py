from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


def compute_status(confidence: float, plant: str = "") -> str:
    if plant.lower() in ("not a plant", "non-plant", "invalid", "unknown") or confidence <= 0.0:
        return "INVALID_IMAGE"
    if confidence > 0.90:
        return "HIGH_CONFIDENCE"
    if confidence >= 0.70:
        return "MEDIUM_CONFIDENCE"
    return "LOW_CONFIDENCE"


class DiagnoseIn(BaseModel):
    imageUrl: str = Field(..., description="Image URL to analyze")


class DiagnosisResponse(BaseModel):
    plant: str
    disease: str
    confidence: float
    status: str
    explanation: str
    treatment: List[str]


class DiagnosisOut(DiagnosisResponse):
    diagnosisId: UUID
    createdAt: datetime


class DiagnosisItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    userId: UUID = Field(validation_alias="user_id", serialization_alias="userId")
    imageUrl: Optional[str] = Field(default=None, validation_alias="image_url", serialization_alias="imageUrl")
    plantName: Optional[str] = Field(default=None, validation_alias="plant_name", serialization_alias="plantName")
    diseaseName: Optional[str] = Field(default=None, validation_alias="disease_name", serialization_alias="diseaseName")
    confidence: Optional[float] = None
    status: Optional[str] = None
    explanation: Optional[str] = None
    treatment: Optional[Any] = None
    createdAt: datetime = Field(validation_alias="created_at", serialization_alias="createdAt")


class HistoryOut(BaseModel):
    success: bool = True
    items: List[DiagnosisItem]
    total: int
    page: int
    limit: int
    totalPages: int


class StatsOut(BaseModel):
    success: bool = True
    totalScans: int
