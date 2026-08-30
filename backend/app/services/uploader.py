import asyncio
import logging
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIMETYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image_bytes(file_bytes: bytes, content_type: str) -> str:
    if content_type not in ALLOWED_MIMETYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, GIF, and WebP images are allowed",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image file provided",
        )

    try:
        response = await asyncio.to_thread(
            cloudinary.uploader.upload,
            file_bytes,
            folder="plantdoc-ai",
            resource_type="image",
        )

        secure_url = response.get("secure_url") or response.get("url")
        if not secure_url:
            raise ValueError("No URL returned from Cloudinary")
        return secure_url
    except Exception as e:
        logger.error("Cloudinary upload error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image upload failed",
        )
