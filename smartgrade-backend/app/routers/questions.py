"""Question generation and notes upload endpoints."""

from __future__ import annotations

import io
import re
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user
from app.models import User
from app.routers.users import capabilities_for
from app.services import question_generator

router = APIRouter(prefix="/api/questions", tags=["questions"])

GenType = Literal["mcq", "short", "long", "true_false"]


class GenerateRequest(BaseModel):
    notes: str = Field(..., min_length=20, max_length=10_000,
                       description="Lecture notes or textbook excerpt")
    count: int = Field(default=5, ge=1, le=20)
    types: list[GenType] = Field(default_factory=lambda: ["mcq", "short"])
    custom_prompt: str | None = Field(
        default=None, max_length=2000,
        description="Custom instructions for the LLM on what kind of questions to generate"
    )


class GeneratedQuestion(BaseModel):
    type: GenType
    marks: int
    question_text: str
    options: list[str] | None = None
    correct_answer: str
    rubric: str | None = None


class GenerateResponse(BaseModel):
    questions: list[GeneratedQuestion]
    is_mock: bool


class NotesUploadResponse(BaseModel):
    text: str
    filename: str
    char_count: int


@router.post("/generate", response_model=GenerateResponse)
def generate(
    body: GenerateRequest,
    user: User = Depends(get_current_user),
):
    # ── Plan gate
    caps = capabilities_for(user.plan)
    if not caps.can_generate_questions:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "AI question generation requires the Smart Grading or Advanced plan. "
            "Upgrade to unlock this feature.",
        )

    if not body.types:
        raise HTTPException(400, "Pick at least one question type")

    questions = question_generator.generate_questions(
        notes=body.notes,
        count=body.count,
        types=body.types,
        custom_prompt=body.custom_prompt,
    )
    return GenerateResponse(
        questions=[GeneratedQuestion(**q) for q in questions],
        is_mock=not question_generator.is_real_llm_enabled(),
    )


@router.post("/upload-notes", response_model=NotesUploadResponse)
async def upload_notes(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload a text, PDF, or DOCX file and extract its text content.

    The extracted text can then be used with the /generate endpoint
    to create exam questions from the notes.
    """
    # Validate file type
    filename = file.filename or "notes.txt"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
    allowed_exts = {"txt", "pdf", "docx"}
    if ext not in allowed_exts:
        raise HTTPException(
            400,
            f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(allowed_exts))}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file uploaded")
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(413, "File too large (max 10MB)")

    # Extract text based on file type
    text = _extract_text(content, ext, filename)

    if not text or not text.strip():
        raise HTTPException(400, "Could not extract any text from the file")

    text = text.strip()
    return NotesUploadResponse(
        text=text,
        filename=filename,
        char_count=len(text),
    )


def _extract_text(content: bytes, ext: str, filename: str) -> str:
    """Extract text content from a file."""
    if ext == "txt":
        # Try UTF-8 first, then fall back to latin-1
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")

    elif ext == "pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            texts = []
            for page in doc:
                texts.append(page.get_text())
            doc.close()
            return "\n\n".join(texts)
        except ImportError:
            raise HTTPException(500, "PDF extraction library not available")
        except Exception as e:
            raise HTTPException(400, f"Failed to extract text from PDF: {e}")

    elif ext == "docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            texts = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(texts)
        except ImportError:
            raise HTTPException(500, "DOCX extraction library not available")
        except Exception as e:
            raise HTTPException(400, f"Failed to extract text from DOCX: {e}")

    return ""