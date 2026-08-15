"""Initial migration — create all tables.

Revision ID: 001_initial
Revises: None
Create Date: 2026-08-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.execute("CREATE TYPE user_role AS ENUM ('student', 'instructor')")
    op.execute("CREATE TYPE question_type AS ENUM ('mcq', 'freetext')")
    op.execute("CREATE TYPE session_status AS ENUM ('active', 'submitted', 'flagged', 'reviewed', 'dismissed')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", postgresql.ENUM("student", "instructor", name="user_role", create_type=False), nullable=False, server_default="student"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("consent_accepted", sa.Boolean(), server_default="false"),
        sa.Column("consent_accepted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Enrollments
    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("keystroke_baseline", postgresql.JSON(), nullable=True),
        sa.Column("face_photo_path", sa.String(500), nullable=True),
        sa.Column("face_embedding", postgresql.JSON(), nullable=True),
        sa.Column("baseline_passage", sa.Text(), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("is_complete", sa.Boolean(), server_default="false"),
    )

    # Exams
    op.create_table(
        "exams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("duration_minutes", sa.Integer(), server_default="60"),
        sa.Column("is_published", sa.Boolean(), server_default="false"),
        sa.Column("settings", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Questions
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id", ondelete="CASCADE")),
        sa.Column("question_type", postgresql.ENUM("mcq", "freetext", name="question_type", create_type=False), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSON(), nullable=True),
        sa.Column("correct_answer", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("points", sa.Integer(), server_default="1"),
    )

    # Exam Sessions
    op.create_table(
        "exam_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id", ondelete="CASCADE")),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("answers", postgresql.JSON(), nullable=True),
        sa.Column("overall_risk_score", sa.Float(), nullable=True),
        sa.Column("status", postgresql.ENUM("active", "submitted", "flagged", "reviewed", "dismissed", name="session_status", create_type=False), server_default="active"),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_action", sa.Text(), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("total_bytes_sent", sa.Integer(), server_default="0"),
    )

    # Telemetry Windows
    op.create_table(
        "telemetry_windows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exam_sessions.id", ondelete="CASCADE")),
        sa.Column("window_index", sa.Integer(), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("window_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("keystroke_features", postgresql.JSON(), nullable=True),
        sa.Column("mouse_features", postgresql.JSON(), nullable=True),
        sa.Column("tab_events", postgresql.JSON(), nullable=True),
        sa.Column("keystroke_score", sa.Float(), nullable=True),
        sa.Column("face_score", sa.Float(), nullable=True),
        sa.Column("gaze_score", sa.Float(), nullable=True),
        sa.Column("composite_score", sa.Float(), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), server_default="false"),
        sa.Column("evidence", postgresql.JSON(), nullable=True),
        sa.Column("scored_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Snapshots
    op.create_table(
        "snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exam_sessions.id", ondelete="CASCADE")),
        sa.Column("window_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("telemetry_windows.id", ondelete="SET NULL"), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), server_default="0"),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("face_detected", sa.Boolean(), server_default="false"),
        sa.Column("face_count", sa.Integer(), server_default="0"),
        sa.Column("face_embedding", postgresql.JSON(), nullable=True),
        sa.Column("gaze_direction", postgresql.JSON(), nullable=True),
        sa.Column("face_match_score", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("snapshots")
    op.drop_table("telemetry_windows")
    op.drop_table("exam_sessions")
    op.drop_table("questions")
    op.drop_table("exams")
    op.drop_table("enrollments")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS session_status")
    op.execute("DROP TYPE IF EXISTS question_type")
    op.execute("DROP TYPE IF EXISTS user_role")
