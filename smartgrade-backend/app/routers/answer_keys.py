from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import AnswerKey, User
from app.schemas.answer_key import AnswerKeyCreate, AnswerKeyOut, AnswerKeyUpdate

router = APIRouter(prefix="/api/answer-keys", tags=["answer-keys"])


def _get_owned(key_id: int, user: User, db: Session) -> AnswerKey:
    key = db.query(AnswerKey).filter(
        AnswerKey.id == key_id, AnswerKey.owner_id == user.id
    ).first()
    if not key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer key not found")
    return key


@router.get("", response_model=list[AnswerKeyOut])
def list_keys(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(AnswerKey)
        .filter(AnswerKey.owner_id == user.id)
        .order_by(AnswerKey.created_at.desc())
        .all()
    )


@router.post("", response_model=AnswerKeyOut, status_code=status.HTTP_201_CREATED)
def create_key(
    payload: AnswerKeyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    key = AnswerKey(**payload.model_dump(), owner_id=user.id)
    db.add(key)
    db.commit()
    db.refresh(key)
    return key


@router.patch("/{key_id}", response_model=AnswerKeyOut)
def update_key(
    key_id: int,
    payload: AnswerKeyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    key = _get_owned(key_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(key, field, value)
    db.commit()
    db.refresh(key)
    return key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key(
    key_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    key = _get_owned(key_id, user, db)
    db.delete(key)
    db.commit()


@router.post("/{key_id}/activate", response_model=AnswerKeyOut)
def set_active(
    key_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark this key as active and deactivate all other keys for this user."""
    key = _get_owned(key_id, user, db)

    db.query(AnswerKey).filter(
        AnswerKey.owner_id == user.id, AnswerKey.id != key_id
    ).update({"is_active": False})
    key.is_active = True

    db.commit()
    db.refresh(key)
    return key
