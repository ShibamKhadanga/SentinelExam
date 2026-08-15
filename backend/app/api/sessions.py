"""Exam session API routes — start, submit, and manage sessions."""

from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_student, get_current_user
from app.models.user import User
from app.models.exam import Exam
from app.models.enrollment import Enrollment
from app.models.session import ExamSession, SessionStatus
from app.schemas.session import (
    StartSessionRequest,
    SubmitSessionRequest,
    SessionResponse,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionResponse, status_code=201)
async def start_session(
    data: StartSessionRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Start an exam session."""
    # Verify enrollment
    enrollment = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = enrollment.scalar_one_or_none()
    if not enrollment or not enrollment.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete enrollment before taking exams",
        )

    # Verify exam exists and is published
    exam_result = await db.execute(
        select(Exam).where(Exam.id == data.exam_id, Exam.is_published == True)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not published")

    # Check for active session
    active = await db.execute(
        select(ExamSession).where(
            ExamSession.student_id == current_user.id,
            ExamSession.exam_id == data.exam_id,
            ExamSession.status == SessionStatus.ACTIVE,
        )
    )
    existing = active.scalar_one_or_none()
    if existing:
        return SessionResponse(
            id=existing.id,
            student_id=existing.student_id,
            student_name=current_user.name,
            exam_id=existing.exam_id,
            exam_title=exam.title,
            started_at=existing.started_at,
            submitted_at=existing.submitted_at,
            overall_risk_score=existing.overall_risk_score,
            status=existing.status.value,
        )

    session = ExamSession(
        student_id=current_user.id,
        exam_id=data.exam_id,
    )
    db.add(session)
    await db.flush()

    return SessionResponse(
        id=session.id,
        student_id=session.student_id,
        student_name=current_user.name,
        exam_id=session.exam_id,
        exam_title=exam.title,
        started_at=session.started_at,
        submitted_at=None,
        overall_risk_score=None,
        status=session.status.value,
    )


@router.post("/{session_id}/submit", response_model=SessionResponse)
async def submit_session(
    session_id: UUID,
    data: SubmitSessionRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Submit exam session with answers."""
    result = await db.execute(
        select(ExamSession)
        .where(
            ExamSession.id == session_id,
            ExamSession.student_id == current_user.id,
        )
        .options(selectinload(ExamSession.exam))
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session already submitted")

    session.answers = data.answers
    session.submitted_at = datetime.now(timezone.utc)
    session.status = SessionStatus.SUBMITTED

    # Auto-flag if overall risk score is above threshold
    from app.config import settings as app_settings
    if session.overall_risk_score and session.overall_risk_score >= app_settings.RISK_THRESHOLD_MEDIUM:
        session.status = SessionStatus.FLAGGED

    await db.flush()

    return SessionResponse(
        id=session.id,
        student_id=session.student_id,
        student_name=current_user.name,
        exam_id=session.exam_id,
        exam_title=session.exam.title if session.exam else None,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        overall_risk_score=session.overall_risk_score,
        status=session.status.value,
    )


@router.get("/my-sessions", response_model=list[SessionResponse])
async def get_my_sessions(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Get all sessions for current student."""
    result = await db.execute(
        select(ExamSession)
        .where(ExamSession.student_id == current_user.id)
        .options(selectinload(ExamSession.exam))
        .order_by(ExamSession.started_at.desc())
    )
    sessions = result.scalars().all()

    return [
        SessionResponse(
            id=s.id,
            student_id=s.student_id,
            student_name=current_user.name,
            exam_id=s.exam_id,
            exam_title=s.exam.title if s.exam else None,
            started_at=s.started_at,
            submitted_at=s.submitted_at,
            overall_risk_score=s.overall_risk_score,
            status=s.status.value,
        )
        for s in sessions
    ]
