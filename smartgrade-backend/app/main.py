from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.models import AnswerKey, QuestionResult, Scan, User  # noqa: F401  (registers models with Base)
from app.routers import analytics, answer_keys, auth, questions, scans, users

# Create tables on startup. For production, swap to Alembic migrations.
Base.metadata.create_all(bind=engine)

# Make sure the upload directory exists before any request hits it.
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="SmartGrade API",
    description="Backend for the SmartGrade EdTech platform",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(answer_keys.router)
app.include_router(scans.router)
app.include_router(questions.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"name": "SmartGrade API", "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
