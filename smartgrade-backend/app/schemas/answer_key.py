from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


QuestionType = Literal["mcq", "short", "long", "true_false"]


class Question(BaseModel):
    """A single question in an answer key."""

    number: int = Field(..., gt=0, description="Question number, 1-based")
    type: QuestionType
    marks: int = Field(..., gt=0, description="Marks for this question")
    correct_answer: str = Field(..., min_length=1, description="Letter (MCQ) or model answer text")
    rubric: str | None = Field(default=None, description="Optional grading guidance for written")

    @field_validator("correct_answer")
    @classmethod
    def strip_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("correct_answer cannot be empty")
        return v

    @model_validator(mode="after")
    def validate_mcq_letter(self) -> "Question":
        if self.type == "mcq":
            allowed = {"A", "B", "C", "D", "E"}
            if self.correct_answer.upper() not in allowed:
                raise ValueError(f"MCQ correct_answer must be one of {sorted(allowed)}")
            self.correct_answer = self.correct_answer.upper()
        return self


class AnswerKeyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(default="", max_length=100)
    total_marks: int = Field(..., gt=0)

    # Exam metadata
    exam_code: str | None = Field(default=None, max_length=50)
    exam_title: str | None = Field(default=None, max_length=200)
    teacher_name: str | None = Field(default=None, max_length=100)

    # Optional source notes — when generated from notes, store them here so
    # the grader can verify student answers against the original material.
    source_notes: str | None = Field(default=None, max_length=50_000)
    generation_prompt: str | None = Field(default=None, max_length=10_000)

    # One of these two must be provided.
    answers: list[str] | None = Field(default=None, description="Legacy MCQ-only list")
    questions: list[Question] | None = Field(default=None, description="Rich per-question structure")

    @field_validator("answers")
    @classmethod
    def validate_legacy_answers(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        allowed = {"A", "B", "C", "D", "E"}
        for ans in v:
            if ans not in allowed:
                raise ValueError(f"Each legacy answer must be one of {sorted(allowed)}")
        return v

    @model_validator(mode="after")
    def require_one(self) -> "AnswerKeyBase":
        if not self.answers and not self.questions:
            raise ValueError("Provide either 'answers' (legacy MCQ) or 'questions' (full)")
        if self.questions:
            # Sanity-check total_marks against sum of question marks.
            qsum = sum(q.marks for q in self.questions)
            if qsum != self.total_marks:
                raise ValueError(
                    f"total_marks ({self.total_marks}) does not match sum of question marks ({qsum})"
                )
        return self


class AnswerKeyCreate(AnswerKeyBase):
    pass


class AnswerKeyUpdate(BaseModel):
    name: str | None = None
    subject: str | None = None
    total_marks: int | None = None
    exam_code: str | None = None
    exam_title: str | None = None
    teacher_name: str | None = None
    source_notes: str | None = Field(default=None, max_length=50_000)
    generation_prompt: str | None = None
    answers: list[str] | None = None
    questions: list[Question] | None = None


class AnswerKeyOut(AnswerKeyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    owner_id: int
