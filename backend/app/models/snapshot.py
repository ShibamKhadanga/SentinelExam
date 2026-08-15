"""Snapshot model — periodic webcam capture metadata."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.database import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exam_sessions.id", ondelete="CASCADE")
    )
    window_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("telemetry_windows.id", ondelete="SET NULL"),
        nullable=True,
    )

    # File storage
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(default=0)

    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Face detection results
    face_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    face_count: Mapped[int | None] = mapped_column(default=0)
    face_embedding: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Gaze direction data from MediaPipe landmarks
    gaze_direction: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Expected: {left_eye_ratio, right_eye_ratio, is_looking_away}

    # Face match confidence score against enrollment
    face_match_score: Mapped[float | None] = mapped_column(nullable=True)

    # Relationships
    session = relationship("ExamSession", back_populates="snapshots")
    window = relationship("TelemetryWindow", back_populates="snapshots")

    def __repr__(self) -> str:
        return f"<Snapshot session={self.session_id} face={self.face_detected}>"
