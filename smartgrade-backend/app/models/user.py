from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Subscription. No real billing yet — these are set manually for now.
    # Possible values: "free" (3 attempts), "smart", "advanced".
    plan = Column(String, nullable=False, default="free")
    free_scans_used = Column(Integer, nullable=False, default=0)

    answer_keys = relationship("AnswerKey", back_populates="owner", cascade="all, delete-orphan")
