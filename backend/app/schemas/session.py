"""Session request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class StartSessionRequest(BaseModel):
    exam_id: UUID


class SubmitAnswerRequest(BaseModel):
    question_id: UUID
    answer: str


class SubmitSessionRequest(BaseModel):
    answers: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of question_id → answer value"
    )


class SessionResponse(BaseModel):
    id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    exam_id: UUID
    exam_title: Optional[str] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    overall_risk_score: Optional[float] = None
    status: str
    risk_level: Optional[str] = None
    total_bytes_sent: Optional[int] = 0

    model_config = {"from_attributes": True}


class SessionDetailResponse(SessionResponse):
    answers: Optional[Dict[str, str]] = None
    review_action: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    window_count: int = 0
    flagged_window_count: int = 0


class ReviewActionRequest(BaseModel):
    action: str = Field(..., pattern="^(confirm|dismiss|escalate)$")
    notes: Optional[str] = None
