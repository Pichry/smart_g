"""Scan endpoints.

POST   /api/scans            multipart upload (1+ images), returns scan id
GET    /api/scans            list this user's scans
GET    /api/scans/{id}       full detail with per-question results (poll this)
DELETE /api/scans/{id}       remove a scan and its image(s)
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.deps import get_current_user
from app.models import AnswerKey, Scan, User
from app.routers.users import FREE_SCAN_LIMIT, capabilities_for
from app.schemas.scan import ScanCreateResponse, ScanDetailOut, ScanOut
from app.services import grading, storage

router = APIRouter(prefix="/api/scans", tags=["scans"])


MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB per image
MAX_PAGES = 5                         # cap multi-page papers at 5 images


def _run_grading_task(scan_id: int) -> None:
    """Background task wrapper. Opens its own DB session because the request
    session is closed by the time this runs.
    """
    db = SessionLocal()
    try:
        grading.grade_scan(scan_id, db)
    finally:
        db.close()


@router.post("", response_model=ScanCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    background_tasks: BackgroundTasks,
    answer_key_id: int = Form(...),
    images: list[UploadFile] = File(...),
    student_name: str = Form(..., min_length=1),
    student_id: str = Form(..., min_length=1),
    exam_label: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a scanned exam paper. Multiple images per scan are supported
    for multi-page papers — pages are processed in order and results merged.

    Required: answer_key_id, images, student_name, student_id.
    Optional: exam_label.

    Plan gating:
      - Free Trial: max 3 lifetime scans, 1 page per scan, MCQ-only keys
      - Smart Grading: unlimited scans, up to 3 pages, all question types
      - Advanced: unlimited scans, up to 5 pages, all question types
    """
    # ─── Required-field sanity checks (FastAPI's min_length only catches
    #     empty strings; this catches whitespace-only).
    student_name = student_name.strip()
    student_id = student_id.strip()
    if not student_name:
        raise HTTPException(400, "Student name is required")
    if not student_id:
        raise HTTPException(400, "Student ID is required")

    caps = capabilities_for(user.plan)

    # ─── Free-tier scan limit
    if user.plan == "free" and user.free_scans_used >= FREE_SCAN_LIMIT:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "You've used all 3 free scans. Upgrade to keep grading.",
        )

    if not images:
        raise HTTPException(400, "Upload at least one image")

    # ─── Page count by plan
    if len(images) > caps.max_pages_per_scan:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Your plan supports up to {caps.max_pages_per_scan} "
            f"{'page' if caps.max_pages_per_scan == 1 else 'pages'} per scan. "
            f"Upgrade to scan {len(images)}-page papers.",
        )
    if len(images) > MAX_PAGES:
        raise HTTPException(400, f"Maximum {MAX_PAGES} pages per scan")

    # ─── Validate answer key
    key = (
        db.query(AnswerKey)
        .filter(AnswerKey.id == answer_key_id, AnswerKey.owner_id == user.id)
        .first()
    )
    if not key:
        raise HTTPException(404, "Answer key not found")

    # ─── Block free tier from grading written-answer keys
    if not caps.can_grade_written and key.questions:
        has_written = any(
            q.get("type") in ("short", "long") for q in key.questions
        )
        if has_written:
            raise HTTPException(
                status.HTTP_402_PAYMENT_REQUIRED,
                "This answer key has written questions. Free Trial supports "
                "only multiple-choice grading. Upgrade to Smart Grading to "
                "unlock written-answer AI grading.",
            )

    # ─── Read & save each image
    relative_paths: list[str] = []
    for image in images:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(400, f"{image.filename}: not an image file")
        content = await image.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, f"{image.filename}: image too large (max 10MB)")
        if not content:
            raise HTTPException(400, f"{image.filename}: empty upload")
        relative_paths.append(
            storage.save_upload(user.id, content, image.filename or "scan.jpg")
        )

    # ─── Create the Scan row. image_path = first page (back-compat),
    #     image_paths = full list (new field).
    scan = Scan(
        student_name=student_name,
        student_id=student_id,
        exam_label=exam_label,
        image_path=relative_paths[0],
        image_paths=relative_paths,
        status="pending",
        owner_id=user.id,
        answer_key_id=key.id,
    )
    db.add(scan)

    # ─── Increment free-tier counter
    if user.plan == "free":
        user.free_scans_used += 1

    db.commit()
    db.refresh(scan)

    background_tasks.add_task(_run_grading_task, scan.id)

    return ScanCreateResponse(id=scan.id, status=scan.status)


@router.get("", response_model=list[ScanOut])
def list_scans(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = 50,
):
    return (
        db.query(Scan)
        .filter(Scan.owner_id == user.id)
        .order_by(Scan.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/{scan_id}", response_model=ScanDetailOut)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.owner_id == user.id)
        .first()
    )
    if not scan:
        raise HTTPException(404, "Scan not found")
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.owner_id == user.id)
        .first()
    )
    if not scan:
        raise HTTPException(404, "Scan not found")

    # Best-effort image cleanup; don't fail the delete if files are gone.
    paths = scan.image_paths or [scan.image_path]
    for rel in paths:
        if not rel:
            continue
        try:
            p = storage.absolute_path(rel)
            if p.exists():
                p.unlink()
        except OSError:
            pass

    db.delete(scan)
    db.commit()
