"""Auth API routes — register, login, refresh, and user info."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.enrollment import Enrollment
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    RefreshRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])
auth_service = AuthService()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user (student or instructor)."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=req.email,
        name=req.name,
        password_hash=auth_service.hash_password(req.password),
        role=UserRole(req.role),
    )
    db.add(user)
    await db.flush()

    access_token = auth_service.create_access_token(user.id, user.role.value)
    refresh_token = auth_service.create_refresh_token(user.id, user.role.value)

    # Check enrollment status
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            consent_accepted=user.consent_accepted,
            is_enrolled=bool(enrollment and enrollment.is_complete),
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not auth_service.verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = auth_service.create_access_token(user.id, user.role.value)
    refresh_token = auth_service.create_refresh_token(user.id, user.role.value)

    # Check enrollment status
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            consent_accepted=user.consent_accepted,
            is_enrolled=bool(enrollment and enrollment.is_complete),
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    payload = auth_service.decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    from uuid import UUID
    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = auth_service.create_access_token(user.id, user.role.value)
    new_refresh = auth_service.create_refresh_token(user.id, user.role.value)

    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            consent_accepted=user.consent_accepted,
            is_enrolled=bool(enrollment and enrollment.is_complete),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        consent_accepted=current_user.consent_accepted,
        is_enrolled=bool(enrollment and enrollment.is_complete),
    )
