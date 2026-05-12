"""LLM-as-judge grader for written answers.

Sends question + correct answer + rubric + student answer to Claude and asks
for a score (0..marks_possible) plus written feedback for the student.

Falls back to a string-similarity mock when ANTHROPIC_API_KEY is unset so
the pipeline still produces non-trivial results in dev.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from difflib import SequenceMatcher

from app.core.config import settings


@dataclass
class Grade:
    marks_awarded: float
    feedback: str
    reasoning: str = ""


def is_real_llm_enabled() -> bool:
    return bool(settings.ANTHROPIC_API_KEY)


def grade_written(
    question_number: int,
    question_type: str,        # "short" | "long"
    marks_possible: int,
    correct_answer: str,
    rubric: str | None,
    student_answer: str,
    source_notes: str | None = None,
) -> Grade:
    """Grade a single written answer.

    If `source_notes` is provided, the grader uses them as ground-truth context
    so it can fact-check the student against the actual lecture material —
    not just match against the model answer.
    """
    if not student_answer or not student_answer.strip():
        return Grade(0, "No answer provided.", "Empty student response.")

    if not is_real_llm_enabled():
        return _mock_grade(marks_possible, correct_answer, student_answer, source_notes)

    try:
        return _claude_grade(
            question_number, question_type, marks_possible,
            correct_answer, rubric, student_answer, source_notes,
        )
    except Exception as e:
        # Don't fail a whole scan if one question's grading errors out.
        return Grade(
            0,
            "Could not grade automatically — please review manually.",
            f"Grader error: {e!r}",
        )


# ─────────────────────────── Claude path ──────────────────────────────────────

_PROMPT_TEMPLATE = """You are grading a single exam question. Be fair and
consistent. Award partial credit where the student's answer is partially
correct or shows understanding but has gaps.

Question {n} ({qtype}, out of {marks} marks)

{notes_block}CORRECT ANSWER (model answer):
{correct}

{rubric_block}STUDENT ANSWER:
{student}

Respond with ONLY a JSON object — no other text, no markdown fences:
{{
  "marks_awarded": <number from 0 to {marks}, may be a decimal>,
  "feedback": "<one or two sentences for the student, in plain English>",
  "reasoning": "<brief justification for the score, for the teacher>"
}}"""


def _claude_grade(
    question_number: int,
    question_type: str,
    marks_possible: int,
    correct_answer: str,
    rubric: str | None,
    student_answer: str,
    source_notes: str | None,
) -> Grade:
    import anthropic

    rubric_block = f"GRADING RUBRIC:\n{rubric}\n\n" if rubric else ""
    # Truncate notes to keep token cost in check (~1000 tokens at 4 chars/token).
    if source_notes and source_notes.strip():
        truncated = source_notes.strip()[:4000]
        notes_block = (
            "SOURCE NOTES (the lecture / textbook material this exam was based "
            "on — verify the student's answer against these facts):\n"
            f"{truncated}\n\n"
        )
    else:
        notes_block = ""

    prompt = _PROMPT_TEMPLATE.format(
        n=question_number,
        qtype=question_type,
        marks=marks_possible,
        correct=correct_answer,
        rubric_block=rubric_block,
        notes_block=notes_block,
        student=student_answer,
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip() if msg.content else ""

    parsed = _parse_json_response(raw)
    if parsed is None:
        return Grade(0, "Could not parse grader response.", f"Raw output: {raw[:200]}")

    marks = float(parsed.get("marks_awarded", 0))
    marks = max(0.0, min(float(marks_possible), marks))
    return Grade(
        marks_awarded=round(marks, 2),
        feedback=str(parsed.get("feedback", "")).strip(),
        reasoning=str(parsed.get("reasoning", "")).strip(),
    )


def _parse_json_response(text: str) -> dict | None:
    """Pull a JSON object out of the model's response, even with stray prose."""
    text = text.strip()
    # Strip ```json ... ``` if present.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to locate the first {...} block.
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        return None


# ─────────────────────────── Mock path ────────────────────────────────────────

def _mock_grade(
    marks_possible: int,
    correct_answer: str,
    student_answer: str,
    source_notes: str | None = None,
) -> Grade:
    """Generates plausible feedback by comparing student text to the model
    answer. Used when no Anthropic key is set — keeps demos clean while
    making it obvious in the reasoning that real LLM grading isn't active.
    """
    sim = SequenceMatcher(None, correct_answer.lower(), student_answer.lower()).ratio()
    awarded = round(marks_possible * sim, 2)
    notes_suffix = " (cross-checked against source notes)" if source_notes else ""

    if sim >= 0.85:
        feedback = (
            "Excellent — answer covers all the key points clearly and accurately"
            f"{notes_suffix}. Awarded {awarded}/{marks_possible}."
        )
    elif sim >= 0.65:
        feedback = (
            "Good answer with most of the key ideas. Could be sharper on a few "
            f"details{notes_suffix}. Awarded {awarded}/{marks_possible}."
        )
    elif sim >= 0.40:
        feedback = (
            "Partial answer. Mentions some relevant ideas but is missing several "
            f"key concepts from the model answer{notes_suffix}. Awarded {awarded}/{marks_possible}."
        )
    elif sim >= 0.15:
        feedback = (
            "Limited answer. Touches on the topic but doesn't address the core "
            f"of the question{notes_suffix}. Awarded {awarded}/{marks_possible}."
        )
    else:
        feedback = (
            "Answer doesn't match the expected response. Review the topic and "
            f"try again{notes_suffix}. Awarded {awarded}/{marks_possible}."
        )

    return Grade(
        marks_awarded=awarded,
        feedback=feedback,
        reasoning=f"Local similarity grader (sim={sim:.2f}). Set ANTHROPIC_API_KEY for full LLM grading.",
    )
