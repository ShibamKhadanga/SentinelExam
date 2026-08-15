"""Exam request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class QuestionCreate(BaseModel):
    question_type: str = Field(..., pattern="^(mcq|freetext)$")
    body: str = Field(..., min_length=1)
    options: Optional[List[str]] = None  # Required for MCQ
    correct_answer: Optional[str] = None
    order_index: int = 0
    points: int = 1


class QuestionResponse(BaseModel):
    id: UUID
    question_type: str
    body: str
    options: Optional[List[str]] = None
    order_index: int
    points: int

    model_config = {"from_attributes": True}


class QuestionWithAnswer(QuestionResponse):
    correct_answer: Optional[str] = None


class ExamCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    duration_minutes: int = Field(default=60, ge=5, le=480)
    settings: Optional[Dict[str, Any]] = None
    questions: Optional[List[QuestionCreate]] = None


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_published: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class ExamResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    created_by: UUID
    duration_minutes: int
    is_published: bool
    question_count: int = 0
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExamDetailResponse(ExamResponse):
    questions: List[QuestionResponse] = []
    creator_name: Optional[str] = None


class ExamDetailWithAnswers(ExamResponse):
    questions: List[QuestionWithAnswer] = []
