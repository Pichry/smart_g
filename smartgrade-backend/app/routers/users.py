"""User profile + plan endpoints.

Capabilities per plan drive what the rest of the app lets the user do:
question generation, written-answer grading, multi-page papers, etc.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/users", tags=["users"])

PlanName = Literal["free", "smart", "advanced"]
FREE_SCAN_LIMIT = 3


class Capabilities(BaseModel):
    """What this user's plan unlocks. Drives both backend gating and
    frontend conditional UI."""
    can_grade_mcq: bool
    can_grade_written: bool
    can_generate_questions: bool
    can_use_advanced_analytics: bool
    max_pages_per_scan: int
    has_priority_processing: bool


class PlanInfo(BaseModel):
    plan: PlanName
    free_scans_used: int
    free_scans_limit: int
    free_scans_remaining: int
    can_scan: bool
    capabilities: Capabilities


class UpgradeRequest(BaseModel):
    plan: PlanName


def capabilities_for(plan: str) -> Capabilities:
    """Single source of truth: what each plan unlocks."""
    if plan == "advanced":
        return Capabilities(
            can_grade_mcq=True,
            can_grade_written=True,
            can_generate_questions=True,
            can_use_advanced_analytics=True,
            max_pages_per_scan=5,
            has_priority_processing=True,
        )
    if plan == "smart":
        return Capabilities(
            can_grade_mcq=True,
            can_grade_written=True,
            can_generate_questions=True,
            can_use_advanced_analytics=True,
            max_pages_per_scan=3,
            has_priority_processing=False,
        )
    # free
    return Capabilities(
        can_grade_mcq=True,
        can_grade_written=False,        # ← blocked on free
        can_generate_questions=False,    # ← blocked on free
        can_use_advanced_analytics=False,
        max_pages_per_scan=1,            # ← single page only
        has_priority_processing=False,
    )


def get_plan_info(user: User) -> PlanInfo:
    """Compute remaining attempts + whether the user can scan another paper."""
    used = user.free_scans_used
    caps = capabilities_for(user.plan)
    if user.plan == "free":
        remaining = max(0, FREE_SCAN_LIMIT - used)
        return PlanInfo(
            plan="free",
            free_scans_used=used,
            free_scans_limit=FREE_SCAN_LIMIT,
            free_scans_remaining=remaining,
            can_scan=remaining > 0,
            capabilities=caps,
        )
    return PlanInfo(
        plan=user.plan,  # type: ignore[arg-type]
        free_scans_used=used,
        free_scans_limit=FREE_SCAN_LIMIT,
        free_scans_remaining=FREE_SCAN_LIMIT,
        can_scan=True,
        capabilities=caps,
    )


@router.get("/me/plan", response_model=PlanInfo)
def my_plan(user: User = Depends(get_current_user)):
    return get_plan_info(user)


@router.post("/me/upgrade", response_model=PlanInfo)
def upgrade_plan(
    body: UpgradeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Switch this user's plan. Stub for real billing.

    For the hackathon: anyone can call this to switch plans freely.
    Once real payments are wired, gate this behind a paid-webhook check.
    """
    if body.plan not in ("free", "smart", "advanced"):
        raise HTTPException(400, "Unknown plan")
    user.plan = body.plan
    db.commit()
    db.refresh(user)
    return get_plan_info(user)
