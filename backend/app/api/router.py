from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.diagnosis import router as diagnosis_router
from app.api.feedback import router as feedback_router
from app.api.upload import router as upload_router

# Router with /api/v1 prefix (Standard & Local development)
api_router = APIRouter(prefix="/api/v1")

# Router with /v1 prefix (For Vercel Serverless where /api is stripped by routing)
v1_router = APIRouter(prefix="/v1")

for r in [api_router, v1_router]:
    r.include_router(auth_router, prefix="/auth", tags=["auth"])
    r.include_router(upload_router, prefix="/upload", tags=["upload"])
    r.include_router(diagnosis_router, prefix="/diagnosis", tags=["diagnosis"])
    r.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
