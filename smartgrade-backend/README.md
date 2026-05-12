# SmartGrade Backend

FastAPI service for AI-assisted exam grading. Pipeline:

```
Scanner upload  →  OpenCV cleanup  →  ┬→ Bubble detection (MCQ)        ┐
                                       └→ Google Vision OCR (written)   ├→ Marks + feedback
                                                  ↓                     │
                                         Claude LLM-as-judge ───────────┘
```

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then edit if you have API keys
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

The server runs out of the box in **mock mode** — no API keys needed. OCR
returns deterministic placeholder text, the LLM grader uses string similarity.
Set `GOOGLE_APPLICATION_CREDENTIALS` and `ANTHROPIC_API_KEY` in `.env` for real
grading.

## Endpoints

```
# Auth
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

# Answer keys (now supports rich `questions` per-question structure)
GET    /api/answer-keys
POST   /api/answer-keys
PATCH  /api/answer-keys/{id}
DELETE /api/answer-keys/{id}
POST   /api/answer-keys/{id}/activate

# Scans
POST   /api/scans                 multipart upload, returns scan id immediately
GET    /api/scans                 list this user's scans
GET    /api/scans/{id}            full detail with per-question results (poll)
DELETE /api/scans/{id}

# Analytics (real data, replaces mock dashboard)
GET    /api/analytics/dashboard   stats: papers scanned, avg score, trend
GET    /api/analytics             score distribution + 30-day trend
```

All endpoints except auth require `Authorization: Bearer <token>`.

## Answer key shapes

Two shapes are supported on the same endpoint:

**Legacy (MCQ only)** — what the current frontend sends:
```json
{
  "name": "Math Quiz 1",
  "subject": "Math",
  "total_marks": 10,
  "answers": ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B"]
}
```

**Rich (any mix of MCQ / short / long)** — what the new pipeline grades:
```json
{
  "name": "Biology Midterm",
  "subject": "Biology",
  "total_marks": 20,
  "questions": [
    {"number": 1, "type": "mcq", "marks": 1, "correct_answer": "B"},
    {"number": 2, "type": "mcq", "marks": 1, "correct_answer": "D"},
    {
      "number": 3, "type": "short", "marks": 8,
      "correct_answer": "Photosynthesis converts light energy into chemical energy stored in glucose, releasing oxygen as a byproduct.",
      "rubric": "Award full marks for mention of light energy → chemical energy AND oxygen byproduct. Half marks for partial."
    },
    {
      "number": 4, "type": "long", "marks": 10,
      "correct_answer": "<full model answer here>",
      "rubric": "5 marks: identifies all stages. 3 marks: explains regulation. 2 marks: cites examples."
    }
  ]
}
```

`total_marks` must equal the sum of `questions[*].marks` in the rich shape.

## How a scan flows

1. Frontend POSTs `multipart/form-data` to `/api/scans` with the image and
   `answer_key_id`. Returns `{id, status: "pending"}` immediately.
2. A FastAPI BackgroundTask runs `grade_scan(scan.id)` after the response.
3. The pipeline (in `app/services/grading.py`):
   - Loads & preprocesses the image (`preprocessing.py`)
   - For MCQ questions: runs bubble detection (`bubble_detection.py`)
   - For written: extracts text via Google Vision (`ocr.py`), then grades
     each answer with Claude (`llm_grader.py`)
   - Persists `Scan` + `QuestionResult` rows
4. Frontend polls `GET /api/scans/{id}` until `status == "completed"`.

## Cost (per scan, at 1 USD ≈ 1,460 RWF)

- Pure MCQ paper:           ~0 RWF (no external calls)
- 30Q with 10 written:      ~17 RWF
- 50Q with 30 written:      ~45 RWF

OCR via Google Vision is ~$1.50 per 1,000 pages. Grading via Claude Haiku is
~$0.001 per written question. Set the env vars to enable; leave blank to keep
running for free in mock mode.

## Configuration

All settings have defaults — `.env` only needs whatever you want to override.

```env
SECRET_KEY=...                       # JWT signing key (CHANGE in production)
DATABASE_URL=sqlite:///./smartgrade.db
UPLOAD_DIR=./uploads
GOOGLE_APPLICATION_CREDENTIALS=      # path to GCP service-account JSON
ANTHROPIC_API_KEY=                   # for real LLM grading
LLM_MODEL=claude-haiku-4-5-20251001
```

## Production checklist

- [ ] Generate a real `SECRET_KEY` (`python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Add Alembic migrations (currently `create_all` on startup)
- [ ] Swap `services/storage.py` to S3 / Cloudflare R2
- [ ] Add HTTPS in front
- [ ] Set CORS origins to your real frontend domain
- [ ] Move JWT from localStorage → httpOnly cookies
- [ ] Add rate limiting on `/api/auth/*` and `/api/scans`
- [ ] Replace BackgroundTasks with Celery / RQ for real concurrency
