"""Analytics endpoints — aggregates over the user's scans.

These power the Dashboard and Analytics pages (currently mock-data).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Scan, User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class DashboardStats(BaseModel):
    papers_scanned: int
    average_score_pct: float | None
    scans_this_week: int
    last_scan_at: datetime | None


class ScoreDistributionBucket(BaseModel):
    label: str  # "0–20", "20–40", ...
    count: int


class TrendPoint(BaseModel):
    date: str  # ISO date "YYYY-MM-DD"
    avg_pct: float
    count: int


class AnalyticsOut(BaseModel):
    distribution: list[ScoreDistributionBucket]
    trend: list[TrendPoint]
    total_scans: int


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    base = db.query(Scan).filter(
        Scan.owner_id == user.id, Scan.status == "completed"
    )

    total = base.count()
    avg = base.with_entities(func.avg(Scan.percentage)).scalar()

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    this_week = base.filter(Scan.created_at >= week_ago).count()

    last = (
        base.with_entities(func.max(Scan.created_at)).scalar()
    )

    return DashboardStats(
        papers_scanned=total,
        average_score_pct=round(float(avg), 2) if avg is not None else None,
        scans_this_week=this_week,
        last_scan_at=last,
    )


@router.get("", response_model=AnalyticsOut)
def analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    completed = (
        db.query(Scan)
        .filter(Scan.owner_id == user.id, Scan.status == "completed")
        .all()
    )

    # Score distribution into 5 buckets.
    buckets = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 100.01)]
    counts = [0] * len(buckets)
    for s in completed:
        if s.percentage is None:
            continue
        for i, (lo, hi) in enumerate(buckets):
            if lo <= s.percentage < hi:
                counts[i] += 1
                break
    distribution = [
        ScoreDistributionBucket(label=f"{int(lo)}–{int(min(hi, 100))}", count=c)
        for (lo, hi), c in zip(buckets, counts)
    ]

    # Trend: average percentage per day, last 30 days.
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    daily: dict[str, list[float]] = {}
    for s in completed:
        if s.created_at < cutoff or s.percentage is None:
            continue
        day = s.created_at.date().isoformat()
        daily.setdefault(day, []).append(s.percentage)

    trend = sorted(
        [
            TrendPoint(
                date=day,
                avg_pct=round(sum(vals) / len(vals), 2),
                count=len(vals),
            )
            for day, vals in daily.items()
        ],
        key=lambda p: p.date,
    )

    return AnalyticsOut(
        distribution=distribution,
        trend=trend,
        total_scans=len(completed),
    )
