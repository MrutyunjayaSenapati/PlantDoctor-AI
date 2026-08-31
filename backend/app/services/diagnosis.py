import math
import logging
from uuid import UUID
import httpx
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Diagnosis
from app.schemas.diagnosis import DiagnosisResponse
from app.services.ai.registry import get_provider

logger = logging.getLogger(__name__)


async def fetch_image_bytes(image_url: str) -> bytes:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error("Failed to download image from %s: %s", image_url, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not download image from provided URL: {str(e)}",
        )


async def analyze_and_save_diagnosis(
    session: AsyncSession, user_id: UUID, image_url: str
) -> Diagnosis:
    logger.info("[Diagnosis] Fetching image bytes from %s...", image_url)
    image_bytes = await fetch_image_bytes(image_url)

    logger.info("[Diagnosis] Analyzing image with AI provider...")
    provider = get_provider()
    result = await provider.analyze(image_bytes)

    logger.info("[Diagnosis] Saving diagnosis to DB...")
    diagnosis = Diagnosis(
        user_id=user_id,
        image_url=image_url,
        plant_name=result.plant,
        disease_name=result.disease,
        confidence=result.confidence,
        status=result.status,
        explanation=result.explanation,
        treatment=result.treatment,
    )
    session.add(diagnosis)
    await session.commit()
    await session.refresh(diagnosis)

    return diagnosis


async def get_diagnosis_history(
    session: AsyncSession, user_id: UUID, page: int = 1, limit: int = 10
):
    offset = (page - 1) * limit

    # Query items
    stmt = (
        select(Diagnosis)
        .where(Diagnosis.user_id == user_id)
        .order_by(Diagnosis.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    res = await session.execute(stmt)
    items = res.scalars().all()

    # Query total count
    count_stmt = select(func.count()).select_from(Diagnosis).where(Diagnosis.user_id == user_id)
    count_res = await session.execute(count_stmt)
    total = count_res.scalar() or 0

    total_pages = math.ceil(total / limit) if limit > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }


async def get_diagnosis_stats(session: AsyncSession, user_id: UUID) -> int:
    count_stmt = select(func.count()).select_from(Diagnosis).where(Diagnosis.user_id == user_id)
    res = await session.execute(count_stmt)
    total_scans = res.scalar() or 0
    return total_scans
