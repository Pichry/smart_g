"""Generate exam questions from teacher notes using Claude.

Falls back to a deterministic mock when ANTHROPIC_API_KEY is unset, so
the demo flow works without paying.
"""

from __future__ import annotations

import json
import re
from typing import Literal

from app.core.config import settings
from app.services.llm_grader import _parse_json_response  # reuse robust JSON parser


GeneratedType = Literal["mcq", "short", "long", "true_false"]


def is_real_llm_enabled() -> bool:
    return bool(settings.ANTHROPIC_API_KEY)


_PROMPT = """You are an exam question writer for a teacher in a Rwandan
secondary school. The teacher will give you their lecture notes; you will
generate clear, factually-correct exam questions based on those notes.

NOTES:
{notes}

Generate exactly {count} questions covering the most important concepts in
the notes. Use a mix of these types: {types_csv}.

{custom_prompt_block}For MCQ questions: write 4 plausible options (A, B, C, D), with one clearly
correct. The "correct_answer" field is the letter.

For True/False questions: write a clear statement that is either true or false
based on the notes. Set "correct_answer" to "True" or "False".

For "short" questions: write a question that needs 1–3 sentence answer.
"correct_answer" is the model answer (1–3 sentences).

For "long" questions: write a question that needs a paragraph or more.
"correct_answer" is a 3–5 sentence model answer.

Respond with ONLY a JSON array, no other text, no markdown fences:
[
  {{
    "type": "mcq" | "true_false" | "short" | "long",
    "marks": <integer, 1 for mcq/true_false, 3-5 for short, 6-10 for long>,
    "question_text": "<the question itself>",
    "options": ["A: ...", "B: ...", "C: ...", "D: ..."],   // ONLY for mcq, omit otherwise
    "correct_answer": "<letter for mcq, 'True'/'False' for true_false, or model answer text>",
    "rubric": "<grading guidance for short/long, or null>"
  }},
  ...
]"""


def generate_questions(
    notes: str,
    count: int,
    types: list[GeneratedType],
    custom_prompt: str | None = None,
) -> list[dict]:
    """Generate `count` questions from `notes`, distributed across `types`.

    Args:
        notes: The lecture/textbook content to base questions on.
        count: How many questions to generate (1-20).
        types: What question types to include.
        custom_prompt: Optional custom instructions for the LLM.
    """
    if not notes or not notes.strip():
        return []
    count = max(1, min(20, count))
    if not types:
        types = ["mcq", "short", "true_false"]

    if not is_real_llm_enabled():
        return _mock_generate(notes, count, types)

    try:
        return _claude_generate(notes, count, types, custom_prompt)
    except Exception as e:
        # On any failure, return mock with a notice.
        result = _mock_generate(notes, count, types)
        for q in result:
            q["rubric"] = (q.get("rubric") or "") + f" [generator error: {e!r}]"
        return result


def _claude_generate(notes: str, count: int, types: list[str], custom_prompt: str | None = None) -> list[dict]:
    import anthropic

    custom_prompt_block = ""
    if custom_prompt and custom_prompt.strip():
        custom_prompt_block = (
            "ADDITIONAL TEACHER INSTRUCTIONS:\n"
            f"{custom_prompt.strip()}\n\n"
            "Follow these instructions carefully when writing the questions.\n\n"
        )

    prompt = _PROMPT.format(
        notes=notes[:8000],            # safety cap on input
        count=count,
        types_csv=", ".join(types),
        custom_prompt_block=custom_prompt_block,
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip() if msg.content else ""

    # The grader's JSON parser returns a dict; we need an array. Strip fences
    # and parse manually.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        parsed = json.loads(match.group(0)) if match else []

    if not isinstance(parsed, list):
        parsed = []

    return [_normalise_question(q) for q in parsed[:count]]


def _normalise_question(q: dict) -> dict:
    """Coerce an LLM-generated question to a clean canonical shape."""
    qtype = q.get("type", "short").lower()
    if qtype not in ("mcq", "short", "long", "true_false"):
        qtype = "short"

    marks = q.get("marks")
    if not isinstance(marks, int) or marks < 1:
        marks = 1 if qtype in ("mcq", "true_false") else 5 if qtype == "short" else 8

    correct = str(q.get("correct_answer", "")).strip()
    if qtype == "mcq" and len(correct) > 1:
        correct = correct[0].upper()  # accept "A: ..." → "A"

    return {
        "type": qtype,
        "marks": marks,
        "question_text": str(q.get("question_text", "")).strip(),
        "options": q.get("options") if qtype == "mcq" else None,
        "correct_answer": correct,
        "rubric": q.get("rubric"),
    }


# ─────────────────────────── mock fallback ───────────────────────────────────

_TOPIC_RE = re.compile(r"\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\b")


def _mock_generate(notes: str, count: int, types: list[str]) -> list[dict]:
    """Pull noun-ish phrases from the notes and turn them into plausible-
    looking exam questions. Without an API key, we can't generate truly
    novel content — but this produces output that reads like a real
    teacher's question bank for demo purposes.
    """
    phrases = list(dict.fromkeys(_TOPIC_RE.findall(notes)))
    # Strip very short or very long matches.
    phrases = [p for p in phrases if 4 <= len(p) <= 40]
    while len(phrases) < count:
        phrases.append(f"the topic in section {len(phrases) + 1}")

    mcq_templates = [
        ("Which of the following best describes {p}?",
         ["A correct definition of {p}", "A common misconception", "An unrelated concept", "An entirely different topic"]),
        ("What is the main feature of {p}?",
         ["The defining property of {p}", "A secondary characteristic", "An unrelated attribute", "An incorrect assumption"]),
        ("Which statement about {p} is true?",
         ["A factually correct claim about {p}", "A partially correct statement", "A common error", "An unrelated claim"]),
    ]
    short_templates = [
        "Briefly explain {p} and give one example.",
        "Define {p} in your own words.",
        "Describe the role of {p}.",
        "What is meant by {p}? Support your answer.",
    ]
    long_templates = [
        "Discuss {p} in detail. Include its causes, effects, and examples.",
        "Explain {p} thoroughly. Compare it with at least one related concept.",
        "Analyse {p}. Why is it important, and what are its implications?",
    ]

    true_false_templates = [
        "{p} is a key concept in this topic.",
        "The process of {p} requires energy input from the cell.",
        "{p} occurs only in eukaryotic cells.",
        "{p} was first discovered in the 20th century.",
    ]

    questions = []
    for i, phrase in enumerate(phrases[:count]):
        qtype = types[i % len(types)]
        if qtype == "mcq":
            template, options = mcq_templates[i % len(mcq_templates)]
            questions.append({
                "type": "mcq",
                "marks": 1,
                "question_text": template.format(p=phrase),
                "options": [
                    f"A: {options[0].format(p=phrase)}",
                    f"B: {options[1]}",
                    f"C: {options[2]}",
                    f"D: {options[3]}",
                ],
                "correct_answer": "A",
                "rubric": None,
            })
        elif qtype == "true_false":
            tf_template = true_false_templates[i % len(true_false_templates)]
            questions.append({
                "type": "true_false",
                "marks": 1,
                "question_text": f"True or False: {tf_template.format(p=phrase)}",
                "options": None,
                "correct_answer": "True",
                "rubric": None,
            })
        elif qtype == "short":
            template = short_templates[i % len(short_templates)]
            questions.append({
                "type": "short",
                "marks": 5,
                "question_text": template.format(p=phrase),
                "options": None,
                "correct_answer": f"A clear 1–3 sentence explanation of {phrase}, drawing on the lecture notes.",
                "rubric": "Award full marks for accurate definition with one supporting example.",
            })
        else:
            template = long_templates[i % len(long_templates)]
            questions.append({
                "type": "long",
                "marks": 8,
                "question_text": template.format(p=phrase),
                "options": None,
                "correct_answer": f"A multi-paragraph discussion of {phrase} drawing on the source material with examples.",
                "rubric": "3 marks for definition. 3 marks for examples. 2 marks for clarity and structure.",
            })
    return questions
