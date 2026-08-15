"""Database seed script — creates demo users and sample exam."""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import engine, async_session_factory, Base
from app.models.user import User, UserRole
from app.models.enrollment import Enrollment
from app.models.exam import Exam, Question, QuestionType
from app.services.auth_service import AuthService

auth_service = AuthService()


async def seed():
    """Seed the database with demo data."""
    async with async_session_factory() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "instructor@sentinel.edu"))
        if result.scalar_one_or_none():
            print("[OK] Database already seeded")
            return

        print("[SEED] Seeding database...")

        # ─── Create Instructor ───
        instructor = User(
            email="instructor@sentinel.edu",
            name="Dr. Sarah Chen",
            password_hash=auth_service.hash_password("sentinel123"),
            role=UserRole.INSTRUCTOR,
            consent_accepted=True,
            consent_accepted_at=datetime.now(timezone.utc),
        )
        db.add(instructor)

        # ─── Create Student ───
        student = User(
            email="student@sentinel.edu",
            name="Alex Johnson",
            password_hash=auth_service.hash_password("sentinel123"),
            role=UserRole.STUDENT,
            consent_accepted=True,
            consent_accepted_at=datetime.now(timezone.utc),
        )
        db.add(student)
        await db.flush()

        # ─── Create Enrollment for Student ───
        enrollment = Enrollment(
            user_id=student.id,
            keystroke_baseline={
                "mean_dwell": 95.4,
                "std_dwell": 28.7,
                "mean_flight": 120.3,
                "std_flight": 45.2,
                "wpm": 42.5,
                "total_keys": 156,
            },
            face_photo_path="",
            face_embedding=[0.1] * 128,  # Dummy 128-dim embedding
            baseline_passage="The quick brown fox jumps over the lazy dog.",
            is_complete=True,
        )
        db.add(enrollment)

        # ─── Create Sample Exam ───
        exam = Exam(
            title="Introduction to Computer Science — Midterm",
            description=(
                "This exam covers fundamental CS concepts including algorithms, "
                "data structures, and basic programming principles. "
                "Duration: 45 minutes. All questions are mandatory."
            ),
            created_by=instructor.id,
            duration_minutes=45,
            is_published=True,
            settings={
                "snapshot_interval_seconds": 45,
                "risk_threshold_override": None,
            },
        )
        db.add(exam)
        await db.flush()

        # ─── Add Questions ───
        questions = [
            Question(
                exam_id=exam.id,
                question_type=QuestionType.MCQ,
                body="What is the time complexity of binary search on a sorted array?",
                options=["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                correct_answer="1",  # index of O(log n)
                order_index=0,
                points=2,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.MCQ,
                body="Which data structure uses LIFO (Last In, First Out) ordering?",
                options=["Queue", "Stack", "Linked List", "Hash Table"],
                correct_answer="1",  # Stack
                order_index=1,
                points=2,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.MCQ,
                body="What does the acronym 'HTTP' stand for?",
                options=[
                    "HyperText Transfer Protocol",
                    "High Transfer Text Protocol",
                    "HyperText Transmission Process",
                    "High Throughput Transfer Protocol",
                ],
                correct_answer="0",
                order_index=2,
                points=1,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.FREETEXT,
                body="Explain the difference between a stack and a queue. Provide a real-world analogy for each.",
                correct_answer=None,
                order_index=3,
                points=5,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.MCQ,
                body="Which sorting algorithm has the best average-case time complexity?",
                options=["Bubble Sort — O(n²)", "Merge Sort — O(n log n)", "Selection Sort — O(n²)", "Insertion Sort — O(n²)"],
                correct_answer="1",
                order_index=4,
                points=2,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.FREETEXT,
                body="Write a Python function that reverses a string without using built-in reverse methods. Explain your approach.",
                correct_answer=None,
                order_index=5,
                points=5,
            ),
            Question(
                exam_id=exam.id,
                question_type=QuestionType.MCQ,
                body="What is the primary purpose of an operating system?",
                options=[
                    "To run web applications",
                    "To manage hardware resources and provide services to programs",
                    "To compile source code",
                    "To connect to the internet",
                ],
                correct_answer="1",
                order_index=6,
                points=2,
            ),
        ]

        for q in questions:
            db.add(q)

        await db.commit()
        print("[OK] Seed complete: instructor, student, enrollment, and sample exam created")


if __name__ == "__main__":
    asyncio.run(seed())
else:
    # When imported as module (docker compose command)
    asyncio.run(seed())
