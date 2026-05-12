"""Grading orchestrator — the pipeline brain.

Glues together preprocessing, MCQ bubble detection, written-answer OCR, and
LLM-as-judge grading. Called by the scans router as a background task.

End-to-end flow:
  1. Load image, preprocess (deskew, threshold) — services.preprocessing
  2. Look at the answer key to know what to grade
  3. For MCQ questions  → bubble detection + exact match
  4. For written        → OCR + LLM grading (or mock fallback)
  5. Sum scores, persist a Scan + per-question QuestionResult rows
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import AnswerKey, QuestionResult, Scan
from app.services import bubble_detection, llm_grader, ocr, preprocessing, storage

log = logging.getLogger("smartgrade.grading")


def grade_scan(scan_id: int, db: Session) -> None:
    """Run the full pipeline for one scan. Updates DB rows in place.

    Designed to be called from a FastAPI BackgroundTask. Catches its own
    errors and writes them to the scan's `error_message` rather than raising.
    """
    scan: Scan | None = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        log.error(f"grade_scan: scan {scan_id} not found")
        return

    try:
        scan.status = "processing"
        db.commit()

        key: AnswerKey | None = (
            db.query(AnswerKey).filter(AnswerKey.id == scan.answer_key_id).first()
        )
        if not key:
            raise ValueError(f"Answer key {scan.answer_key_id} not found")

        questions = _normalise_questions(key)
        if not questions:
            raise ValueError("Answer key has no questions to grade")

        # Multi-page support: process every uploaded image and merge results.
        page_paths = scan.image_paths or [scan.image_path]
        # Pass through the answer key's source notes so the LLM grader can
        # verify written answers against the original lecture material.
        results = _run_pipeline_multipage(page_paths, questions, key.source_notes)

        # Persist per-question results.
        total_awarded = 0.0
        total_possible = 0
        for q, r in zip(questions, results):
            db.add(
                QuestionResult(
                    scan_id=scan.id,
                    question_number=q["number"],
                    question_type=q["type"],
                    marks_possible=q["marks"],
                    marks_awarded=r["marks_awarded"],
                    correct_answer=q["correct_answer"],
                    student_answer=r["student_answer"],
                    feedback=r.get("feedback"),
                    raw=r.get("raw"),
                )
            )
            total_awarded += r["marks_awarded"]
            total_possible += q["marks"]

        scan.score = int(round(total_awarded))
        scan.total_marks = total_possible
        scan.percentage = (
            round(100 * total_awarded / total_possible, 2) if total_possible else 0.0
        )
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        log.exception(f"grade_scan({scan_id}) failed")
        scan.status = "failed"
        scan.error_message = f"{type(e).__name__}: {e}"
        db.commit()


# ─────────────────────────── pipeline internals ──────────────────────────────

def _normalise_questions(key: AnswerKey) -> list[dict]:
    """Coerce both answer-key shapes (legacy `answers` and rich `questions`)
    into a single list of dicts: {number, type, marks, correct_answer, rubric}.
    """
    if key.questions:
        return [
            {
                "number": q["number"],
                "type": q["type"],
                "marks": q["marks"],
                "correct_answer": q["correct_answer"],
                "rubric": q.get("rubric"),
            }
            for q in key.questions
        ]

    # Legacy MCQ-only shape: split total_marks evenly across answers.
    if key.answers:
        n = len(key.answers)
        per_q = max(1, key.total_marks // n)
        return [
            {
                "number": i + 1,
                "type": "mcq",
                "marks": per_q,
                "correct_answer": ans,
                "rubric": None,
            }
            for i, ans in enumerate(key.answers)
        ]

    return []


def _run_pipeline_multipage(
    page_paths: list[str],
    questions: list[dict],
    source_notes: str | None = None,
) -> list[dict]:
    """Process every page, then grade each question.

    Strategy: run preprocessing on each page, accumulate detected MCQ
    answers and OCR text blocks across all pages in order, then grade.
    `source_notes` (if provided on the answer key) is passed to the LLM
    grader for each written question so it can verify against source.
    """
    all_mcq_detected: list[str | None] = []
    all_ocr_blocks: list[str] = []

    mcq_questions = [q for q in questions if q["type"] in ("mcq", "true_false")]
    written_questions = [q for q in questions if q["type"] in ("short", "long")]

    for rel in page_paths:
        page_path = storage.absolute_path(rel)
        if not page_path.exists():
            raise FileNotFoundError(f"Page image missing on disk: {page_path}")

        warped, thresh = preprocessing.preprocess(page_path)

        # ─── MCQ branch
        if mcq_questions:
            # Tell the detector how many questions to expect across all pages
            # combined; we crop each page's worth back below.
            page_answers = bubble_detection.detect_mcq_answers(
                thresh, len(mcq_questions)
            )
            # Filter out trailing Nones (likely "no row found" rather than real
            # blank answers) so a second page's answers can extend the list.
            while page_answers and page_answers[-1] is None and len(all_mcq_detected) + len(page_answers) > len(mcq_questions):
                page_answers.pop()
            all_mcq_detected.extend(page_answers)

        # ─── Written branch
        if written_questions:
            import cv2
            clean_path = page_path.parent / f"clean_{page_path.name}"
            cv2.imwrite(str(clean_path), warped)
            try:
                all_ocr_blocks.extend(ocr.extract_text_blocks(clean_path))
            finally:
                try:
                    clean_path.unlink()
                except OSError:
                    pass

    # Pad / trim to the right counts.
    if len(all_mcq_detected) < len(mcq_questions):
        all_mcq_detected.extend([None] * (len(mcq_questions) - len(all_mcq_detected)))
    all_mcq_detected = all_mcq_detected[: len(mcq_questions)]

    # Map results back to the original question order.
    results: list[dict] = []
    mcq_idx = 0
    written_idx = 0
    for q in questions:
        if q["type"] in ("mcq", "true_false"):
            student = all_mcq_detected[mcq_idx] if mcq_idx < len(all_mcq_detected) else None
            mcq_idx += 1
            awarded = q["marks"] if student and student == q["correct_answer"] else 0
            results.append(
                {
                    "student_answer": student,
                    "marks_awarded": float(awarded),
                    "feedback": None,
                    "raw": {"detected": student, "expected": q["correct_answer"]},
                }
            )
        else:
            student_text = all_ocr_blocks[written_idx] if written_idx < len(all_ocr_blocks) else ""
            written_idx += 1
            grade = llm_grader.grade_written(
                question_number=q["number"],
                question_type=q["type"],
                marks_possible=q["marks"],
                correct_answer=q["correct_answer"],
                rubric=q.get("rubric"),
                student_answer=student_text,
                source_notes=source_notes,
            )
            results.append(
                {
                    "student_answer": student_text,
                    "marks_awarded": grade.marks_awarded,
                    "feedback": grade.feedback,
                    "raw": {"reasoning": grade.reasoning},
                }
            )

    return results
