"""ExamSession model — represents a student actively taking an exam."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, Float, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
import enum

from app.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    SUBMITTED = "submitted"
    FLAGGED = "flagged"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"


class FlagAction(str, enum.Enum):
    CONFIRM = "confirm"
    DISMISS = "dismiss"
    ESCALATE = "escalate"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE")
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Student answers — {question_id: answer_value}
    answers: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)

    # Overall composite risk score (updated as windows are scored)
    overall_risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus, name="session_status", values_callable=lambda e: [x.value for x in e]),
        default=SessionStatus.ACTIVE,
    )

    # Instructor review fields
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bandwidth tracking (for thesis metrics)
    total_bytes_sent: Mapped[int | None] = mapped_column(default=0)

    # Relationships
    student = relationship("User", back_populates="exam_sessions", foreign_keys=[student_id])
    exam = relationship("Exam", back_populates="sessions")
    telemetry_windows = relationship(
        "TelemetryWindow", back_populates="session",
        cascade="all, delete-orphan", order_by="TelemetryWindow.window_start"
    )
    snapshots = relationship(
        "Snapshot", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ExamSession student={self.student_id} exam={self.exam_id} status={self.status.value}>"
