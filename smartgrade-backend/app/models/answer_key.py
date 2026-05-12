from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class AnswerKey(Base):
    """An answer key defines what the correct answers are for a paper.

    Two shapes are supported:

    1. Legacy: `answers` = ["A", "B", "C", ...] for pure MCQ.
       This is what the old frontend creates. Still works for grading.

    2. Rich: `questions` = [{number, type, marks, correct_answer, rubric}, ...]
       Required for written-answer grading. `type` is one of mcq | short | long | true_false.
       For mcq, `correct_answer` is the letter. For true_false it's "True" or "False".
       For short/long, it's the model answer text and `rubric` is optional grading guidance.

    The grader prefers `questions` if present, else falls back to `answers`.

    `source_notes` (optional): the lecture notes / textbook excerpt this key
    was generated from. When present, the grader passes them to the LLM so
    student answers can be verified against the actual source material —
    not just matched against the model answer. This makes grading much more
    accurate for written questions.
    """

    __tablename__ = "answer_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False, default="")
    total_marks = Column(Integer, nullable=False)

    # Exam metadata (for generated exams)
    exam_code = Column(String, nullable=True)
    exam_title = Column(String, nullable=True)
    teacher_name = Column(String, nullable=True)

    # Legacy MCQ-only field, kept for backward compat with existing keys.
    answers = Column(JSON, nullable=True)

    # New richer per-question structure. See docstring above.
    questions = Column(JSON, nullable=True)

    # Source notes used to generate this key — also fed to grader for context.
    source_notes = Column(Text, nullable=True)

    # Custom prompt used to generate questions (for reference)
    generation_prompt = Column(Text, nullable=True)

    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="answer_keys")
    scans = relationship("Scan", back_populates="answer_key", cascade="all, delete-orphan")
