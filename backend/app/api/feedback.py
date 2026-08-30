import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.feedback import FeedbackData, FeedbackIn, FeedbackOut
from app.services.feedback import save_feedback

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await save_feedback(
        session=db,
        user_id=current_user.id,
        diagnosis_id=body.diagnosisId,
        is_correct=body.isCorrect,
        comment=body.comment,
    )

    data = FeedbackData.model_validate(entry)
    return FeedbackOut(success=True, data=data)
