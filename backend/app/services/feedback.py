import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Feedback

logger = logging.getLogger(__name__)


async def save_feedback(
    session: AsyncSession,
    user_id: UUID,
    diagnosis_id: UUID,
    is_correct: bool,
    comment: Optional[str] = None,
) -> Feedback:
    logger.info("[Feedback] Saving feedback for diagnosis %s by user %s", diagnosis_id, user_id)
    feedback_entry = Feedback(
        diagnosis_id=diagnosis_id,
        user_id=user_id,
        is_correct=is_correct,
        comment=comment,
    )
    session.add(feedback_entry)
    await session.commit()
    await session.refresh(feedback_entry)
    return feedback_entry
