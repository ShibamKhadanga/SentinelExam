"""Telemetry ingestion API — receives batched telemetry and triggers scoring."""

import os
import base64
import uuid as uuid_mod
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, require_student
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.session import ExamSession, SessionStatus
from app.models.telemetry import TelemetryWindow
from app.models.snapshot import Snapshot
from app.schemas.telemetry import TelemetryBatch
from app.scoring.fusion import FusionService
from app.config import settings

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])
fusion_service = FusionService()


def _compute_keystroke_features(keystrokes):
    """Extract aggregate keystroke features from raw events."""
    if not keystrokes:
        return {"mean_dwell": 0, "std_dwell": 0, "mean_flight": 0, "std_flight": 0, "wpm": 0, "key_count": 0}

    import numpy as np
    dwell_times = [k.dwell_time for k in keystrokes if k.dwell_time > 0]
    flight_times = [k.flight_time for k in keystrokes if k.flight_time and k.flight_time > 0]

    # Estimate WPM: ~5 chars per word
    if keystrokes:
        time_span = (keystrokes[-1].timestamp - keystrokes[0].timestamp) / 1000  # seconds
        wpm = (len(keystrokes) / 5) / max(time_span / 60, 0.01)
    else:
        wpm = 0

    return {
        "mean_dwell": float(np.mean(dwell_times)) if dwell_times else 0,
        "std_dwell": float(np.std(dwell_times)) if dwell_times else 0,
        "mean_flight": float(np.mean(flight_times)) if flight_times else 0,
        "std_flight": float(np.std(flight_times)) if flight_times else 0,
        "wpm": round(wpm, 2),
        "key_count": len(keystrokes),
    }


def _compute_mouse_features(mouse_events):
    """Extract aggregate mouse features from raw events."""
    if not mouse_events:
        return {"total_distance": 0, "mean_velocity": 0, "max_velocity": 0, "idle_periods": 0, "click_count": 0}

    import numpy as np
    distances = []
    velocities = []
    click_count = sum(1 for e in mouse_events if e.event_type == "click")

    for i in range(1, len(mouse_events)):
        dx = mouse_events[i].x - mouse_events[i - 1].x
        dy = mouse_events[i].y - mouse_events[i - 1].y
        dist = (dx ** 2 + dy ** 2) ** 0.5
        dt = max(mouse_events[i].timestamp - mouse_events[i - 1].timestamp, 1) / 1000  # seconds
        distances.append(dist)
        velocities.append(dist / dt)

    # Count idle periods (gaps > 2 seconds with no mouse movement)
    idle_periods = 0
    for i in range(1, len(mouse_events)):
        gap = (mouse_events[i].timestamp - mouse_events[i - 1].timestamp) / 1000
        if gap > 2.0:
            idle_periods += 1

    return {
        "total_distance": round(sum(distances), 2),
        "mean_velocity": round(float(np.mean(velocities)), 2) if velocities else 0,
        "max_velocity": round(float(np.max(velocities)), 2) if velocities else 0,
        "idle_periods": idle_periods,
        "click_count": click_count,
    }


@router.post("/batch")
async def ingest_telemetry(
    batch: TelemetryBatch,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Ingest a batch of telemetry data for a session window."""
    # Verify session belongs to user and is active
    result = await db.execute(
        select(ExamSession).where(
            ExamSession.id == batch.session_id,
            ExamSession.student_id == current_user.id,
            ExamSession.status == SessionStatus.ACTIVE,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    # Compute features
    keystroke_features = _compute_keystroke_features(batch.keystrokes)
    mouse_features = _compute_mouse_features(batch.mouse_events)
    tab_event_dicts = [e.model_dump() for e in batch.tab_events]

    # Create telemetry window
    window = TelemetryWindow(
        session_id=batch.session_id,
        window_index=batch.window_index,
        window_start=datetime.fromtimestamp(batch.window_start, tz=timezone.utc),
        window_end=datetime.fromtimestamp(batch.window_end, tz=timezone.utc),
        keystroke_features=keystroke_features,
        mouse_features=mouse_features,
        tab_events=tab_event_dicts,
    )
    db.add(window)
    await db.flush()

    # Process and save snapshots
    snapshot_gaze_data = []
    for snap_data in batch.snapshots:
        # Save snapshot image to disk
        snap_dir = os.path.join(settings.SNAPSHOT_DIR, "sessions", str(batch.session_id))
        os.makedirs(snap_dir, exist_ok=True)
        snap_filename = f"snap_{batch.window_index}_{uuid_mod.uuid4().hex[:8]}.jpg"
        snap_path = os.path.join(snap_dir, snap_filename)

        try:
            image_bytes = base64.b64decode(snap_data.image_base64)
            with open(snap_path, "wb") as f:
                f.write(image_bytes)
            file_size = len(image_bytes)
        except Exception:
            snap_path = ""
            file_size = 0

        snapshot = Snapshot(
            session_id=batch.session_id,
            window_id=window.id,
            file_path=snap_path,
            file_size_bytes=file_size,
            captured_at=datetime.fromtimestamp(snap_data.captured_at, tz=timezone.utc),
            face_detected=snap_data.face_detected,
            face_count=snap_data.face_count,
            face_embedding=snap_data.face_embedding,
            gaze_direction=snap_data.gaze_direction,
        )
        db.add(snapshot)

        snapshot_gaze_data.append({
            "face_detected": snap_data.face_detected,
            "face_count": snap_data.face_count,
            **(snap_data.gaze_direction or {}),
        })

    await db.flush()

    # ─── Run scoring pipeline ───
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    baseline_data = {
        "keystroke_baseline": enrollment.keystroke_baseline if enrollment else None,
        "face_baseline": {"face_embedding": enrollment.face_embedding} if enrollment else None,
    }

    # Prepare face data (use first snapshot's face data for this window)
    face_data = {}
    if batch.snapshots:
        first_snap = batch.snapshots[0]
        face_data = {
            "face_detected": first_snap.face_detected,
            "face_count": first_snap.face_count,
            "face_embedding": first_snap.face_embedding,
        }

    gaze_data = {"snapshots": snapshot_gaze_data}

    scoring_result = await fusion_service.compute_composite_score(
        keystroke_data=keystroke_features,
        face_data=face_data,
        gaze_data=gaze_data,
        baseline_data=baseline_data,
    )

    # Update window with scores
    window.keystroke_score = scoring_result["keystroke_score"]
    window.face_score = scoring_result["face_score"]
    window.gaze_score = scoring_result["gaze_score"]
    window.composite_score = scoring_result["composite_score"]
    window.is_flagged = scoring_result["is_flagged"]
    window.evidence = scoring_result["evidence"]
    window.scored_at = datetime.now(timezone.utc)

    # Update session's overall risk score (running average)
    all_windows_result = await db.execute(
        select(TelemetryWindow).where(
            TelemetryWindow.session_id == batch.session_id,
            TelemetryWindow.composite_score.isnot(None),
        )
    )
    all_windows = all_windows_result.scalars().all()
    if all_windows:
        scores = [w.composite_score for w in all_windows]
        session.overall_risk_score = round(sum(scores) / len(scores), 4)

    # Track bandwidth
    if batch.bytes_size:
        session.total_bytes_sent = (session.total_bytes_sent or 0) + batch.bytes_size

    await db.flush()

    # Broadcast to instructor dashboard via WebSocket
    from app.api.websocket import manager
    await manager.broadcast_to_exam(
        str(session.exam_id),
        {
            "type": "score_update",
            "session_id": str(session.id),
            "window_index": batch.window_index,
            "composite_score": scoring_result["composite_score"],
            "risk_level": scoring_result["risk_level"],
            "is_flagged": scoring_result["is_flagged"],
            "overall_risk_score": session.overall_risk_score,
        },
    )

    return {
        "window_id": str(window.id),
        "scores": scoring_result,
        "overall_risk_score": session.overall_risk_score,
    }
