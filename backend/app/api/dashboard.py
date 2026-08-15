"""Instructor dashboard API routes."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_instructor
from app.models.user import User
from app.models.exam import Exam
from app.models.session import ExamSession, SessionStatus
from app.models.telemetry import TelemetryWindow
from app.models.snapshot import Snapshot
from app.schemas.session import SessionResponse, SessionDetailResponse, ReviewActionRequest
from app.schemas.telemetry import TelemetryWindowResponse
from app.config import settings

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _risk_level(score: Optional[float]) -> Optional[str]:
    if score is None:
        return None
    if score < settings.RISK_THRESHOLD_LOW:
        return "low"
    elif score < settings.RISK_THRESHOLD_MEDIUM:
        return "medium"
    elif score < settings.RISK_THRESHOLD_HIGH:
        return "high"
    return "critical"


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    exam_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """List all exam sessions for instructor's exams."""
    # Get instructor's exam IDs
    exams_result = await db.execute(
        select(Exam.id).where(Exam.created_by == current_user.id)
    )
    exam_ids = [row[0] for row in exams_result.all()]

    if not exam_ids:
        return []

    query = (
        select(ExamSession)
        .where(ExamSession.exam_id.in_(exam_ids))
        .options(
            selectinload(ExamSession.student),
            selectinload(ExamSession.exam),
        )
    )

    if exam_id:
        query = query.where(ExamSession.exam_id == exam_id)
    if status_filter:
        query = query.where(ExamSession.status == SessionStatus(status_filter))

    query = query.order_by(ExamSession.started_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        SessionResponse(
            id=s.id,
            student_id=s.student_id,
            student_name=s.student.name if s.student else None,
            student_email=s.student.email if s.student else None,
            exam_id=s.exam_id,
            exam_title=s.exam.title if s.exam else None,
            started_at=s.started_at,
            submitted_at=s.submitted_at,
            overall_risk_score=s.overall_risk_score,
            status=s.status.value,
            risk_level=_risk_level(s.overall_risk_score),
            total_bytes_sent=s.total_bytes_sent,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id: UUID,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed session information with window counts."""
    result = await db.execute(
        select(ExamSession)
        .where(ExamSession.id == session_id)
        .options(
            selectinload(ExamSession.student),
            selectinload(ExamSession.exam),
            selectinload(ExamSession.telemetry_windows),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify instructor owns the exam
    exam_result = await db.execute(
        select(Exam).where(Exam.id == session.exam_id, Exam.created_by == current_user.id)
    )
    if not exam_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not your exam")

    flagged_count = sum(1 for w in session.telemetry_windows if w.is_flagged)

    return SessionDetailResponse(
        id=session.id,
        student_id=session.student_id,
        student_name=session.student.name if session.student else None,
        student_email=session.student.email if session.student else None,
        exam_id=session.exam_id,
        exam_title=session.exam.title if session.exam else None,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        overall_risk_score=session.overall_risk_score,
        status=session.status.value,
        risk_level=_risk_level(session.overall_risk_score),
        total_bytes_sent=session.total_bytes_sent,
        answers=session.answers,
        review_action=session.review_action,
        review_notes=session.review_notes,
        reviewed_at=session.reviewed_at,
        window_count=len(session.telemetry_windows),
        flagged_window_count=flagged_count,
    )


@router.get("/sessions/{session_id}/timeline", response_model=List[TelemetryWindowResponse])
async def get_session_timeline(
    session_id: UUID,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Get per-window risk timeline for a session."""
    # Verify access (simplified)
    result = await db.execute(
        select(TelemetryWindow)
        .where(TelemetryWindow.session_id == session_id)
        .options(selectinload(TelemetryWindow.snapshots))
        .order_by(TelemetryWindow.window_index)
    )
    windows = result.scalars().all()

    return [
        TelemetryWindowResponse(
            id=w.id,
            window_index=w.window_index,
            window_start=w.window_start,
            window_end=w.window_end,
            keystroke_score=w.keystroke_score,
            face_score=w.face_score,
            gaze_score=w.gaze_score,
            composite_score=w.composite_score,
            is_flagged=w.is_flagged,
            keystroke_features=w.keystroke_features,
            mouse_features=w.mouse_features,
            tab_events=w.tab_events,
            evidence=w.evidence,
            snapshot_count=len(w.snapshots),
        )
        for w in windows
    ]


@router.post("/sessions/{session_id}/review")
async def review_session(
    session_id: UUID,
    data: ReviewActionRequest,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Record instructor review action on a session."""
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.review_action = data.action
    session.review_notes = data.notes
    session.reviewed_by = current_user.id
    session.reviewed_at = datetime.now(timezone.utc)

    if data.action == "dismiss":
        session.status = SessionStatus.DISMISSED
    elif data.action in ("confirm", "escalate"):
        session.status = SessionStatus.REVIEWED

    await db.flush()
    return {"message": f"Session {data.action}ed", "status": session.status.value}


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Get summary statistics for the instructor dashboard."""
    exams_result = await db.execute(
        select(Exam.id).where(Exam.created_by == current_user.id)
    )
    exam_ids = [row[0] for row in exams_result.all()]

    if not exam_ids:
        return {
            "total_exams": 0,
            "total_sessions": 0,
            "active_sessions": 0,
            "flagged_sessions": 0,
            "average_risk_score": 0,
        }

    sessions_result = await db.execute(
        select(ExamSession).where(ExamSession.exam_id.in_(exam_ids))
    )
    sessions = sessions_result.scalars().all()

    active = sum(1 for s in sessions if s.status == SessionStatus.ACTIVE)
    flagged = sum(1 for s in sessions if s.status == SessionStatus.FLAGGED)
    scores = [s.overall_risk_score for s in sessions if s.overall_risk_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0

    return {
        "total_exams": len(exam_ids),
        "total_sessions": len(sessions),
        "active_sessions": active,
        "flagged_sessions": flagged,
        "average_risk_score": round(avg_score, 4),
    }


@router.get("/snapshots/{session_id}/{snapshot_id}")
async def get_snapshot_image(
    session_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Serve a snapshot image file."""
    from fastapi.responses import FileResponse

    result = await db.execute(
        select(Snapshot).where(
            Snapshot.id == snapshot_id,
            Snapshot.session_id == session_id,
        )
    )
    snapshot = result.scalar_one_or_none()

    if not snapshot or not snapshot.file_path:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    import os
    if not os.path.exists(snapshot.file_path):
        raise HTTPException(status_code=404, detail="Snapshot file not found")

    return FileResponse(snapshot.file_path, media_type="image/jpeg")
