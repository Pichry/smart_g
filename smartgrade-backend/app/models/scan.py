from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Scan(Base):
    """One scanned paper. Created in `pending` status, processed in the
    background, ends up `completed` or `failed`.
    """

    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, nullable=True)
    student_id = Column(String, nullable=True)
    exam_label = Column(String, nullable=True)  # e.g. "Math Midterm — May 2026"

    # Filesystem path to the (first) uploaded image — kept for back-compat.
    image_path = Column(String, nullable=False)
    # All page images for multi-page papers. Pages are processed in order.
    image_paths = Column(JSON, nullable=True)

    status = Column(String, nullable=False, default="pending")  # pending | processing | completed | failed
    error_message = Column(Text, nullable=True)

    # Aggregated results, populated when grading finishes.
    score = Column(Integer, nullable=True)             # marks awarded
    total_marks = Column(Integer, nullable=True)       # marks possible (snapshot from key at grade time)
    percentage = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answer_key_id = Column(Integer, ForeignKey("answer_keys.id"), nullable=False)

    owner = relationship("User")
    answer_key = relationship("AnswerKey", back_populates="scans")
    results = relationship(
        "QuestionResult",
        back_populates="scan",
        cascade="all, delete-orphan",
        order_by="QuestionResult.question_number",
    )


class QuestionResult(Base):
    """One question's worth of grading inside a Scan."""

    __tablename__ = "question_results"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)

    question_number = Column(Integer, nullable=False)
    question_type = Column(String, nullable=False)  # mcq | short | long
    marks_possible = Column(Integer, nullable=False)
    marks_awarded = Column(Float, nullable=False)

    correct_answer = Column(Text, nullable=True)     # letter for MCQ, text for written
    student_answer = Column(Text, nullable=True)     # what we extracted
    feedback = Column(Text, nullable=True)           # for written answers
    raw = Column(JSON, nullable=True)                # debug / extra info per stage

    scan = relationship("Scan", back_populates="results")
