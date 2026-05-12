from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./smartgrade.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS — your Vite dev server
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Image storage — local FS for dev. For production, swap services/storage.py
    # to write to S3 / Cloudflare R2.
    UPLOAD_DIR: str = "./uploads"

    # ── External services. All optional — pipeline runs in mock mode when empty.
    # That way you can develop and demo without paying for OCR / LLM calls.
    GOOGLE_APPLICATION_CREDENTIALS: str = ""  # path to service account JSON
    ANTHROPIC_API_KEY: str = ""               # for LLM-as-judge grading
    LLM_MODEL: str = "claude-haiku-4-5-20251001"

    class Config:
        env_file = ".env"


settings = Settings()
