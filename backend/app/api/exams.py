"""Exam CRUD API routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user, require_instructor
from app.models.user import User, UserRole
from app.models.exam import Exam, Question, QuestionType
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamDetailResponse,
    QuestionCreate,
    QuestionResponse,
)

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.get("/", response_model=List[ExamResponse])
async def list_exams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List exams — instructors see their own, students see published ones."""
    if current_user.role == UserRole.INSTRUCTOR:
        query = select(Exam).where(Exam.created_by == current_user.id)
    else:
        query = select(Exam).where(Exam.is_published == True)

    query = query.options(selectinload(Exam.questions))
    result = await db.execute(query.order_by(Exam.created_at.desc()))
    exams = result.scalars().all()

    return [
        ExamResponse(
            id=e.id,
            title=e.title,
            description=e.description,
            created_by=e.created_by,
            duration_minutes=e.duration_minutes,
            is_published=e.is_published,
            question_count=len(e.questions),
            settings=e.settings,
            created_at=e.created_at,
        )
        for e in exams
    ]


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam(
    exam_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get exam detail with questions."""
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id)
        .options(selectinload(Exam.questions), selectinload(Exam.creator))
    )
    exam = result.scalar_one_or_none()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Students can only see published exams
    if current_user.role == UserRole.STUDENT and not exam.is_published:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = [
        QuestionResponse(
            id=q.id,
            question_type=q.question_type.value,
            body=q.body,
            options=q.options,
            order_index=q.order_index,
            points=q.points,
        )
        for q in sorted(exam.questions, key=lambda x: x.order_index)
    ]

    return ExamDetailResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        created_by=exam.created_by,
        duration_minutes=exam.duration_minutes,
        is_published=exam.is_published,
        question_count=len(questions),
        settings=exam.settings,
        created_at=exam.created_at,
        questions=questions,
        creator_name=exam.creator.name if exam.creator else None,
    )


@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: ExamCreate,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Create a new exam with optional questions."""
    exam = Exam(
        title=data.title,
        description=data.description,
        created_by=current_user.id,
        duration_minutes=data.duration_minutes,
        settings=data.settings or {},
    )
    db.add(exam)
    await db.flush()

    question_count = 0
    if data.questions:
        for i, q_data in enumerate(data.questions):
            question = Question(
                exam_id=exam.id,
                question_type=QuestionType(q_data.question_type),
                body=q_data.body,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                order_index=q_data.order_index or i,
                points=q_data.points,
            )
            db.add(question)
            question_count += 1

    await db.flush()

    return ExamResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        created_by=exam.created_by,
        duration_minutes=exam.duration_minutes,
        is_published=exam.is_published,
        question_count=question_count,
        settings=exam.settings,
        created_at=exam.created_at,
    )


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    data: ExamUpdate,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Update an exam."""
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id, Exam.created_by == current_user.id)
        .options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if data.title is not None:
        exam.title = data.title
    if data.description is not None:
        exam.description = data.description
    if data.duration_minutes is not None:
        exam.duration_minutes = data.duration_minutes
    if data.is_published is not None:
        exam.is_published = data.is_published
    if data.settings is not None:
        exam.settings = data.settings

    await db.flush()

    return ExamResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        created_by=exam.created_by,
        duration_minutes=exam.duration_minutes,
        is_published=exam.is_published,
        question_count=len(exam.questions),
        settings=exam.settings,
        created_at=exam.created_at,
    )


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: UUID,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Delete an exam."""
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.created_by == current_user.id)
    )
    exam = result.scalar_one_or_none()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    await db.delete(exam)


@router.post("/{exam_id}/questions", response_model=QuestionResponse, status_code=201)
async def add_question(
    exam_id: UUID,
    data: QuestionCreate,
    current_user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    """Add a question to an exam."""
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.created_by == current_user.id)
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    question = Question(
        exam_id=exam_id,
        question_type=QuestionType(data.question_type),
        body=data.body,
        options=data.options,
        correct_answer=data.correct_answer,
        order_index=data.order_index,
        points=data.points,
    )
    db.add(question)
    await db.flush()

    return QuestionResponse(
        id=question.id,
        question_type=question.question_type.value,
        body=question.body,
        options=question.options,
        order_index=question.order_index,
        points=question.points,
    )
