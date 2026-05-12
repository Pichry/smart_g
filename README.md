# SmartGrade — Full Stack

EdTech platform for AI-assisted exam grading. Both backend and frontend are
wired together and the full pipeline runs end-to-end.

```
smartgrade/
├── smartgrade-backend/    FastAPI + SQLite + JWT + OpenCV + Vision + Claude
└── smartgrade-frontend/   React + Vite + Tailwind
```

## What works

| Feature                       | Status                                         |
|-------------------------------|------------------------------------------------|
| Sign up / Sign in / Logout    | ✅ Real auth (JWT)                             |
| Protected routes              | ✅ `/app/*` redirects when logged out          |
| Persistent sessions           | ✅ Token in localStorage                       |
| Answer keys CRUD              | ✅ MCQ + short + long with rubric              |
| Set active answer key         | ✅                                             |
| **Scan a paper (upload)**     | ✅ Real upload, file picker                    |
| **Scan a paper (camera)**     | ✅ Phone back-camera via `capture="environment"` |
| **OpenCV preprocessing**      | ✅ Deskew, perspective correction, threshold   |
| **MCQ bubble detection**      | ✅ No template required                        |
| **OCR for written answers**   | ✅ Google Vision (mock fallback without key)   |
| **AI grading + feedback**     | ✅ Claude Haiku (mock fallback without key)    |
| **Background grading + poll** | ✅ Upload returns immediately, UI polls        |
| Dashboard                     | ✅ Real stats from `/api/analytics/dashboard`  |
| Results page                  | ✅ List + detail with per-question feedback    |
| Analytics                     | ✅ Real distribution + 30-day trend            |
| Dark mode                     | ✅ Settings → Appearance                       |
| Subscription billing          | ⚠️  UI only (no Stripe / mobile money yet)    |
| User roles                    | ❌ Single-user model for now                  |

## Quick start

You need: **Python 3.10+** and **Node 18+**.

### Terminal 1 — backend

```bash
cd smartgrade-backend
python3 -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                    # then add API keys if you have them
uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000. API docs at http://localhost:8000/docs.

### Terminal 2 — frontend

```bash
cd smartgrade-frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

### Demo account (for hackathon / showing it off)

After installing the backend, populate it with a demo account + 14 graded scans:

```bash
cd smartgrade-backend
source .venv/bin/activate
python seed_demo.py
```

Then on the auth page, click **"Try with demo account"** for one-tap sign-in,
or use:

- Email: `demo@smartgrade.rw`
- Password: `demo1234`

Dashboard, Results, and Analytics are pre-populated.

### First-time test (real signup)

1. Open http://localhost:5173/app — you get redirected to `/auth`
2. Sign up. You land on the dashboard
3. Go to **Answer keys**, click **Create new key**:
   - Name: "Demo Quiz"
   - Add a few MCQ questions, set the correct letters
   - (Optional) Add a "Short answer" question with a model answer + rubric
   - Save
4. Click **Set active** on the key
5. Go to **Scan a paper**, choose the key, upload any image (or use your phone's
   back camera), click **Grade this paper**
6. The status banner cycles through `uploading → grading → done`, then opens
   the result detail with per-question scores and (for written answers) AI
   feedback
7. **Dashboard**, **Results**, and **Analytics** now show real data based on
   that scan

## Mock mode (no API keys needed)

The backend runs in **mock mode** out of the box:
- OCR returns deterministic placeholder text (hashed from the image)
- The LLM grader uses string similarity instead of calling Claude
- Everything else is real (DB, auth, routing, OpenCV, bubble detection)

This means you can demo the entire pipeline for free. To switch to real
grading, set in `smartgrade-backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-cloud-key.json
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture

### Backend (`smartgrade-backend/`)

```
app/
├── core/              config, database, security, deps
├── models/            User, AnswerKey, Scan, QuestionResult
├── schemas/           Pydantic request/response shapes
├── routers/           auth, answer_keys, scans, analytics
└── services/          The grading pipeline
    ├── preprocessing.py       OpenCV: deskew, threshold
    ├── bubble_detection.py    MCQ contour-based detection
    ├── ocr.py                 Google Vision wrapper + mock
    ├── llm_grader.py          Claude as judge + mock
    ├── grading.py             Orchestrates the full pipeline
    └── storage.py             Local-FS image save (swap for S3 later)
```

### Frontend (`smartgrade-frontend/`)

```
src/app/
├── App.tsx                    Wraps router in <ThemeProvider> + <AuthProvider>
├── routes.tsx                 Routes — /app/* is protected
├── lib/
│   ├── api.ts                 Fetch wrapper + typed endpoint helpers
│   └── AuthContext.tsx        useAuth() hook
├── components/
│   ├── CameraCapture.tsx      Camera + upload, preview, clear
│   ├── Layout.tsx             Sidebar + outlet
│   └── ...                    shared UI
└── pages/
    ├── LandingPage.tsx        Public marketing page
    ├── AuthPage.tsx           Sign in / sign up
    ├── DashboardPage.tsx      Real stats from /api/analytics/dashboard
    ├── ScanPage.tsx           Upload + camera + polling
    ├── AnswerKeysPage.tsx     Rich per-question editor
    ├── ResultsPage.tsx        List + detail modal
    ├── AnalyticsPage.tsx      Distribution + 30-day trend (recharts)
    ├── SubscriptionPage.tsx   Static plans (UI only)
    └── SettingsPage.tsx       Theme toggle works; rest is UI
```

## Cost reference

At ~1 USD = 1,460 RWF (rates fluctuate):

| Paper type                  | Cost per scan |
|-----------------------------|---------------|
| Pure MCQ                    | ~0 RWF        |
| 30 questions, 10 written    | ~17 RWF       |
| 50 questions, 30 written    | ~45 RWF       |

These are real-mode costs (Google Vision + Claude Haiku). Mock mode is free.

## Production checklist

- [ ] Generate a real `SECRET_KEY` (`python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Add Alembic migrations (currently `create_all` on startup)
- [ ] Swap `services/storage.py` to S3 / Cloudflare R2
- [ ] Add HTTPS in front of both servers
- [ ] Set CORS origins to your real frontend domain (`app/core/config.py`)
- [ ] Move JWT from localStorage → httpOnly cookies
- [ ] Add rate limiting on `/api/auth/*` and `/api/scans`
- [ ] Replace BackgroundTasks with Celery / RQ for real concurrency
- [ ] Add tests (zero coverage on either side currently)
- [ ] Wire up real billing (Stripe / Flutterwave / mobile money)
- [ ] Add user roles (Teacher / Student / Admin) when needed

## What's intentionally not built

- **Subscription billing** — needs a payment provider decision (Stripe vs
  Flutterwave vs MTN/Airtel mobile money). The UI is in place; the logic
  is one router away once you pick.
- **User roles** — premature; the system is single-user-per-account today.
  Add when you actually have multiple types of users.
- **Multi-page papers** — current pipeline grades one image per scan. Add
  multi-image upload + page stitching when needed.
- **Tests** — zero coverage. Add pytest + Vitest before you go to production.
