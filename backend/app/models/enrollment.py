"""Enrollment model — stores student biometric baseline data."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    # Keystroke baseline — array of {key, dwellTime, flightTime} objects
    keystroke_baseline: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Face enrollment photo path on disk
    face_photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Face embedding vector (stored as JSON array of floats)
    face_embedding: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Baseline passage used during enrollment
    baseline_passage: Mapped[str | None] = mapped_column(Text, nullable=True)

    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_complete: Mapped[bool] = mapped_column(default=False)

    # Relationships
    user = relationship("User", back_populates="enrollment")

    def __repr__(self) -> str:
        return f"<Enrollment user={self.user_id} complete={self.is_complete}>"
