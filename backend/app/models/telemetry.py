"""TelemetryWindow model — per-time-window aggregated telemetry and scores."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.database import Base


class TelemetryWindow(Base):
    __tablename__ = "telemetry_windows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exam_sessions.id", ondelete="CASCADE")
    )

    # Window time boundaries
    window_index: Mapped[int] = mapped_column(Integer, nullable=False)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ─── Aggregated features (JSON) ───
    keystroke_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Expected: {mean_dwell, std_dwell, mean_flight, std_flight, wpm, key_count}

    mouse_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Expected: {total_distance, mean_velocity, max_velocity, idle_periods, click_count}

    tab_events: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # Expected: [{type: "blur"|"focus", timestamp, duration}]

    # ─── Individual risk scores (0.0 to 1.0) ───
    keystroke_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    face_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    gaze_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ─── Composite risk score ───
    composite_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Was this window flagged?
    is_flagged: Mapped[bool] = mapped_column(default=False)

    # Evidence details for the instructor
    evidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    scored_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    session = relationship("ExamSession", back_populates="telemetry_windows")
    snapshots = relationship("Snapshot", back_populates="window")

    def __repr__(self) -> str:
        return f"<TelemetryWindow #{self.window_index} score={self.composite_score}>"
