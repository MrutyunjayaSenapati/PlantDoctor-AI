from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.diagnosis import router as diagnosis_router
from app.api.feedback import router as feedback_router
from app.api.upload import router as upload_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(upload_router, prefix="/upload", tags=["upload"])
api_router.include_router(diagnosis_router, prefix="/diagnosis", tags=["diagnosis"])
api_router.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
