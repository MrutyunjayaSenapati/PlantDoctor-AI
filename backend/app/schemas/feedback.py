from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FeedbackIn(BaseModel):
    diagnosisId: UUID
    isCorrect: bool
    comment: Optional[str] = Field(default=None, max_length=1000)


class FeedbackData(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    diagnosisId: UUID = Field(validation_alias="diagnosis_id", serialization_alias="diagnosisId")
    userId: UUID = Field(validation_alias="user_id", serialization_alias="userId")
    isCorrect: bool = Field(validation_alias="is_correct", serialization_alias="isCorrect")
    comment: Optional[str] = None
    createdAt: datetime = Field(validation_alias="created_at", serialization_alias="createdAt")


class FeedbackOut(BaseModel):
    success: bool = True
    data: FeedbackData
