"""Enrollment API routes — consent, keystroke baseline, and face photo."""

import os
import uuid
import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, require_student
from app.models.user import User
from app.models.enrollment import Enrollment
from app.schemas.enrollment import (
    BaselineSubmission,
    EnrollmentResponse,
    ConsentRequest,
)
from app.config import settings

router = APIRouter(prefix="/api/enrollment", tags=["enrollment"])

BASELINE_PASSAGE = (
    "The quick brown fox jumps over the lazy dog. "
    "Pack my box with five dozen liquor jugs. "
    "How vexingly quick daft zebras jump. "
    "The five boxing wizards jump quickly."
)


@router.get("/status", response_model=EnrollmentResponse)
async def get_enrollment_status(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Get current enrollment status for the student."""
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        return EnrollmentResponse(
            id=uuid.uuid4(),
            user_id=current_user.id,
            is_complete=False,
            has_keystroke_baseline=False,
            has_face_photo=False,
        )

    return EnrollmentResponse(
        id=enrollment.id,
        user_id=enrollment.user_id,
        is_complete=enrollment.is_complete,
        has_keystroke_baseline=enrollment.keystroke_baseline is not None,
        has_face_photo=enrollment.face_photo_path is not None,
        enrolled_at=enrollment.enrolled_at,
    )


@router.get("/passage")
async def get_baseline_passage():
    """Get the typing passage for baseline enrollment."""
    return {"passage": BASELINE_PASSAGE}


@router.post("/consent")
async def accept_consent(
    req: ConsentRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Accept data collection consent."""
    current_user.consent_accepted = req.accepted
    current_user.consent_accepted_at = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "Consent recorded", "accepted": req.accepted}


@router.post("/baseline", response_model=EnrollmentResponse)
async def submit_baseline(
    data: BaselineSubmission,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Submit keystroke baseline from typing passage."""
    if not current_user.consent_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must accept consent before enrollment",
        )

    # Compute baseline features from raw keystrokes
    dwell_times = [k.dwell_time for k in data.keystrokes if k.dwell_time > 0]
    flight_times = [k.flight_time for k in data.keystrokes if k.flight_time and k.flight_time > 0]

    if len(dwell_times) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough keystroke data. Please type more of the passage.",
        )

    import numpy as np
    baseline = {
        "mean_dwell": float(np.mean(dwell_times)),
        "std_dwell": float(np.std(dwell_times)),
        "mean_flight": float(np.mean(flight_times)) if flight_times else 0.0,
        "std_flight": float(np.std(flight_times)) if flight_times else 0.0,
        "wpm": len(data.passage_text.split()) / max(data.duration_seconds / 60, 0.1),
        "total_keys": len(data.keystrokes),
        "raw_keystrokes": [k.model_dump() for k in data.keystrokes[:500]],  # Store first 500 for later training
    }

    # Get or create enrollment
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        enrollment = Enrollment(
            user_id=current_user.id,
            keystroke_baseline=baseline,
            baseline_passage=data.passage_text,
        )
        db.add(enrollment)
    else:
        enrollment.keystroke_baseline = baseline
        enrollment.baseline_passage = data.passage_text

    # Check if enrollment is now complete
    enrollment.is_complete = (
        enrollment.keystroke_baseline is not None
        and enrollment.face_photo_path is not None
    )
    await db.flush()

    return EnrollmentResponse(
        id=enrollment.id,
        user_id=enrollment.user_id,
        is_complete=enrollment.is_complete,
        has_keystroke_baseline=True,
        has_face_photo=enrollment.face_photo_path is not None,
        enrolled_at=enrollment.enrolled_at,
    )


@router.post("/face-photo", response_model=EnrollmentResponse)
async def upload_face_photo(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    """Upload enrollment face photo."""
    if not current_user.consent_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must accept consent before enrollment",
        )

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be JPEG, PNG, or WebP",
        )

    # Save file
    user_dir = os.path.join(settings.SNAPSHOT_DIR, "enrollment", str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    file_path = os.path.join(user_dir, f"face_reference.{ext}")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Get or create enrollment
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        enrollment = Enrollment(
            user_id=current_user.id,
            face_photo_path=file_path,
        )
        db.add(enrollment)
    else:
        enrollment.face_photo_path = file_path

    enrollment.is_complete = (
        enrollment.keystroke_baseline is not None
        and enrollment.face_photo_path is not None
    )
    await db.flush()

    return EnrollmentResponse(
        id=enrollment.id,
        user_id=enrollment.user_id,
        is_complete=enrollment.is_complete,
        has_keystroke_baseline=enrollment.keystroke_baseline is not None,
        has_face_photo=True,
        enrolled_at=enrollment.enrolled_at,
    )


@router.post("/face-embedding")
async def submit_face_embedding(
    data: dict,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Submit face embedding vector extracted client-side by MediaPipe."""
    embedding = data.get("embedding")
    if not embedding or not isinstance(embedding, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid embedding data",
        )

    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start enrollment first by submitting baseline or face photo",
        )

    enrollment.face_embedding = embedding
    await db.flush()

    return {"message": "Face embedding saved", "embedding_size": len(embedding)}
