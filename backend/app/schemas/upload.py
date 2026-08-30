from pydantic import BaseModel


class UploadOut(BaseModel):
    imageUrl: str
