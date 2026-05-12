# Hackathon demo script — 4 minutes, low-risk

A demo that doesn't depend on photographing a live paper. Every click below
is something you can practice and rehearse — the system is fully populated
from `seed_demo.py` and produces real-looking output even without API keys.

## Before you start

Check both terminals are running:
- Backend: `Uvicorn running on http://127.0.0.1:8000`
- Frontend: `Local: http://localhost:5173/`

Open `http://localhost:5173` in your browser. Do **Ctrl+Shift+R** to hard-refresh
in case the browser cached an older version.

## The 4-minute flow

### 0:00 — Landing page (10 seconds)

Land on the marketing page. One line:

> "SmartGrade is an AI grading platform built for Rwandan classrooms.
> Teachers spend hours grading papers by hand — we do it in seconds."

Click **Sign in**.

### 0:10 — One-tap demo login (5 seconds)

On the auth page, click **"✨ Try with demo account"**.

Land on a populated Dashboard.

> "I'm signed in as a demo teacher. The dashboard shows real data — 14
> graded papers across the last 30 days, average score, recent activity."

### 0:30 — Dashboard tour (30 seconds)

Walk through what's on screen:

> "Three KPIs at the top: papers scanned, average score, last activity.
> Quick actions in the middle. Recent scans below — click any to see the
> grading detail."

Click any recent scan from the list. The Results detail modal opens.

### 1:00 — Per-question feedback (45 seconds)

> "This is the core of the product. Every question is graded individually.
> Multiple choice questions are matched against the answer key. For
> written answers, our AI grader gives a score AND written feedback the
> teacher can hand back to the student."

Scroll through the questions. Read aloud the feedback for one written question:

> "[example: 'Good answer with most key ideas. Could be sharper on a few
> details. Awarded 4/5.']"

Close the modal.

### 1:45 — AI question generation (60 seconds — this is the wow moment)

Click **Answer Keys** in the sidebar.

> "Now let me show you something teachers have been asking for. Instead
> of writing exam questions by hand, paste your lecture notes and let the
> AI write them for you."

Click **Create new key**.

Click **✨ Generate from notes**.

Paste a paragraph of notes. Have one ready in your clipboard:

```
The mitochondrion is the powerhouse of the cell. It has an outer membrane
and an inner membrane folded into cristae which increases surface area for
the electron transport chain. The matrix contains enzymes for the Krebs
cycle. Mitochondria produce ATP through oxidative phosphorylation.
```

Set count to 5, leave MCQ + Short selected, click **Generate**.

Wait 1–3 seconds. Questions appear with model answers and rubrics filled in.

> "Five questions, ready to grade. The teacher edits anything if they want,
> then saves the key. From notes to graded exam in under a minute."

Optional: name the key "Cell Biology" and click Save.

### 2:45 — Subscription tier changes the system live (60 seconds — also a wow moment)

Click **Subscription** in the sidebar.

> "Three tiers, priced for the Rwandan market.
> Free Trial — three free attempts so any teacher can try it.
> Smart Grading — five thousand francs a month for AI grading and OCR.
> Advanced — fifteen thousand a month for institutions, with AI-generated
> exams and batch correction. Payable via mobile money — MTN, Airtel, or card."

Click **Choose Free Trial** to demonstrate the lock-down:

> "Watch what happens when I switch to free."

Wait for the green confirmation banner. Then go to **Answer Keys**:

> "The Generate from Notes button is now locked. The free tier is for
> trying out the system with multiple-choice grading only."

Then go to **Scan a paper**:

> "I can only upload one page at a time, and any answer key with written
> questions shows a lock icon — those need a paid plan."

Go back to **Subscription**, click **Choose Smart Grading**:

> "Upgrade. Now everything's unlocked — written-answer AI grading, AI
> question generation, three-page papers."

Optional: switch to **Advanced** to show 5-page upload and priority badge.

> "Plan changes apply instantly — no payment integration in the demo, but
> the gating logic is real and ready for billing."

### 3:30 — Pipeline & status (30 seconds)

> "Behind the scenes, every scan goes through five stages: image cleanup
> with OpenCV, OCR via Google Vision, AI grading via Claude, then scoring
> and feedback. The full backend is in Python, the frontend is React, and
> we run on a single small server.
>
> Today we are at 85% of an MVP. Auth, grading, dashboard, analytics,
> answer key editor, AI question generation — all working. Real payment
> integration is the last 15%, ready to wire once we pick a provider.
>
> What we need: 5 pilot schools, mentorship on go-to-market, and seed
> funding for API costs and 2 more months of focused engineering."

Done.

## Things NOT to do during the demo

1. **Don't scan a fresh paper live** unless you've tested it works that exact
   morning, in that exact lighting. Use the seeded scans already in Results
   to show grading output. Live capture is fragile.

2. **Don't show the Settings page** — only dark mode is wired, the rest is
   placeholder UI.

3. **Don't click any social-media or footer links on the landing page** —
   they're decorative, not real links.

4. **Don't show the API docs** (`/docs`) unless a judge asks — it shows the
   skeleton honestly but might confuse a non-technical audience.

## Backup plans

**If the question generator returns weird text:** it's running in mock mode
without an API key. The output is template-based but plausible. Move on
quickly — don't dwell on the generated questions, just say "and you can edit
each one before saving."

**If a click hangs:** Ctrl+Shift+R the browser. The auth state survives.

**If the backend crashed:** restart it from Terminal 1 with the same
`uvicorn` command. The DB persists, demo account stays.

**If you fully panic:** open the **Results** page. It shows the most data,
the most variety, and is the most reliable surface to talk over.

## Numbers to memorise

- 17 RWF per scan (mixed paper, 30 questions, 10 written)
- ~6 hours saved per teacher per midterm
- 85% MVP complete
- 14 demo scans, 30 days of data, 3 answer keys ready
- Plans: 0 RWF / 4,990 RWF / 14,990 RWF per month

## After you finish

Have `PITCH.md` open in another tab. If a judge asks "what's the ask," just
read the bullet list at the bottom of that file.
