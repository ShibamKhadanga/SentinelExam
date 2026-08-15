"""Enrollment request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class KeystrokeEvent(BaseModel):
    key: str
    dwell_time: float = Field(..., ge=0, description="Milliseconds key was held")
    flight_time: Optional[float] = Field(None, ge=0, description="Milliseconds between keyup and next keydown")
    timestamp: float


class BaselineSubmission(BaseModel):
    keystrokes: List[KeystrokeEvent]
    passage_text: str
    duration_seconds: float


class EnrollmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    is_complete: bool
    has_keystroke_baseline: bool
    has_face_photo: bool
    enrolled_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ConsentRequest(BaseModel):
    accepted: bool = True
