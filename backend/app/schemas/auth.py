from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class GoogleAuthIn(BaseModel):
    idToken: str = Field(..., description="Google ID Token")


class RegisterIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8, max_length=100)
    confirmPassword: str = Field(..., min_length=8, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    email: Optional[str] = ""
    name: Optional[str] = ""
    avatarUrl: Optional[str] = Field(default="", validation_alias="avatar_url", serialization_alias="avatarUrl")


class TokenOut(BaseModel):
    accessToken: str
    user: UserOut
