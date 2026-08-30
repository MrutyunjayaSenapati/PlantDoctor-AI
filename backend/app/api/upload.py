import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.db.models import User
from app.schemas.upload import UploadOut
from app.services.uploader import upload_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=UploadOut)
async def upload_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not image or not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided",
        )

    file_bytes = await image.read()
    content_type = image.content_type or "image/jpeg"

    image_url = await upload_image_bytes(file_bytes, content_type)
    return UploadOut(imageUrl=image_url)
