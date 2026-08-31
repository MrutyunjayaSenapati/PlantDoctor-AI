import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.schemas.auth import GoogleAuthIn, LoginIn, RegisterIn, TokenOut, UserOut
from app.services.google_verify import verify_google_token

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/google", response_model=TokenOut)
async def login_google(body: GoogleAuthIn, db: AsyncSession = Depends(get_db)):
    profile = await asyncio.to_thread(verify_google_token, body.idToken)

    google_id = profile["google_id"]
    email = profile["email"].lower() if profile["email"] else ""
    name = profile["name"]
    avatar_url = profile["avatar_url"]

    # Check if user exists by google_id or email
    stmt = select(User).where(User.google_id == google_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user and email:
        # Check if user exists by email (e.g. created via email/password previously)
        stmt_email = select(User).where(User.email == email)
        res_email = await db.execute(stmt_email)
        user = res_email.scalar_one_or_none()

    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        if not user.google_id:
            user.google_id = google_id
        user.email = email
        user.name = name
        user.avatar_url = avatar_url
        user.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(
        user_id=str(user.id),
        email=user.email or "",
        name=user.name or "",
    )

    return TokenOut(
        accessToken=access_token,
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
        ),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register_email(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    if body.password != body.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    email_lower = body.email.lower()

    # Check for existing email
    stmt = select(User).where(User.email == email_lower)
    res = await db.execute(stmt)
    existing_user = res.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    hashed_pw = await asyncio.to_thread(hash_password, body.password)

    user = User(
        email=email_lower,
        name=body.name,
        password_hash=hashed_pw,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        user_id=str(user.id),
        email=user.email or "",
        name=user.name or "",
    )

    return TokenOut(
        accessToken=access_token,
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
        ),
    )


@router.post("/login", response_model=TokenOut)
async def login_email(body: LoginIn, db: AsyncSession = Depends(get_db)):
    email_lower = body.email.lower()

    stmt = select(User).where(User.email == email_lower)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    is_valid = await asyncio.to_thread(verify_password, body.password, user.password_hash)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        user_id=str(user.id),
        email=user.email or "",
        name=user.name or "",
    )

    return TokenOut(
        accessToken=access_token,
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
        ),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
    )
