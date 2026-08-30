import logging
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.diagnosis import (
    DiagnoseIn,
    DiagnosisItem,
    DiagnosisOut,
    HistoryOut,
    StatsOut,
)
from app.services.diagnosis import (
    analyze_and_save_diagnosis,
    get_diagnosis_history,
    get_diagnosis_stats,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=DiagnosisOut)
async def create_diagnosis(
    body: DiagnoseIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diagnosis = await analyze_and_save_diagnosis(
        session=db,
        user_id=current_user.id,
        image_url=body.imageUrl,
    )

    treatment_list = diagnosis.treatment if isinstance(diagnosis.treatment, list) else []

    return DiagnosisOut(
        plant=diagnosis.plant_name or "",
        disease=diagnosis.disease_name or "",
        confidence=float(diagnosis.confidence or 0.0),
        status=diagnosis.status or "LOW_CONFIDENCE",
        explanation=diagnosis.explanation or "",
        treatment=[str(t) for t in treatment_list],
        diagnosisId=diagnosis.id,
        createdAt=diagnosis.created_at,
    )


@router.get("/history", response_model=HistoryOut)
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await get_diagnosis_history(
        session=db,
        user_id=current_user.id,
        page=page,
        limit=limit,
    )

    items = [
        DiagnosisItem.model_validate(item)
        for item in result["items"]
    ]

    return HistoryOut(
        success=True,
        items=items,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        totalPages=result["totalPages"],
    )


@router.get("/stats", response_model=StatsOut)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_scans = await get_diagnosis_stats(session=db, user_id=current_user.id)
    return StatsOut(success=True, totalScans=total_scans)
