"""Exam and Question models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, String, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
import enum

from app.database import Base


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    FREETEXT = "freetext"


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    is_published: Mapped[bool] = mapped_column(default=False)

    # Exam-specific settings (snapshot interval, risk thresholds, etc.)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    creator = relationship("User", back_populates="created_exams")
    questions = relationship(
        "Question", back_populates="exam", cascade="all, delete-orphan",
        order_by="Question.order_index"
    )
    sessions = relationship("ExamSession", back_populates="exam")

    def __repr__(self) -> str:
        return f"<Exam {self.title}>"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE")
    )
    question_type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType, name="question_type", values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # For MCQ: list of option strings
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Correct answer — option index for MCQ, keyword/text for freetext
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Display order within the exam
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Points for this question
    points: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    exam = relationship("Exam", back_populates="questions")

    def __repr__(self) -> str:
        return f"<Question {self.question_type.value}: {self.body[:40]}>"
