"""Image storage. Local filesystem for dev.

To swap to S3 / Cloudflare R2 in production, replace the body of `save_upload`
and `path_for` with boto3 calls — the rest of the codebase only touches this
module so nothing else needs to change.
"""

from __future__ import annotations

import secrets
from pathlib import Path

from app.core.config import settings


def _scan_dir(user_id: int) -> Path:
    p = Path(settings.UPLOAD_DIR) / "scans" / str(user_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_upload(user_id: int, content: bytes, original_filename: str) -> str:
    """Save the uploaded image. Returns the relative path stored in DB."""
    suffix = Path(original_filename).suffix.lower() or ".jpg"
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".jpg"

    name = f"{secrets.token_hex(8)}{suffix}"
    full_path = _scan_dir(user_id) / name
    full_path.write_bytes(content)

    # Store as a path relative to UPLOAD_DIR so we can change roots safely.
    return str(Path("scans") / str(user_id) / name)


def absolute_path(relative_path: str) -> Path:
    """Resolve a stored relative path back to the absolute filesystem path."""
    return Path(settings.UPLOAD_DIR) / relative_path
