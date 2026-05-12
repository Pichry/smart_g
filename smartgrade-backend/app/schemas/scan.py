from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


ScanStatus = Literal["pending", "processing", "completed", "failed"]


class QuestionResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_number: int
    question_type: str
    marks_possible: int
    marks_awarded: float
    correct_answer: str | None
    student_answer: str | None
    feedback: str | None


class ScanOut(BaseModel):
    """Light list-view of a scan."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    student_name: str | None
    student_id: str | None
    exam_label: str | None
    status: ScanStatus
    error_message: str | None
    score: int | None
    total_marks: int | None
    percentage: float | None
    created_at: datetime
    completed_at: datetime | None
    answer_key_id: int


class ScanDetailOut(ScanOut):
    """Scan with full per-question results (used on the Results detail page)."""

    results: list[QuestionResultOut]


class ScanCreateResponse(BaseModel):
    """Returned immediately after upload, before grading completes."""

    id: int
    status: ScanStatus
