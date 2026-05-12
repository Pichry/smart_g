# SmartGrade

**AI-assisted exam grading for Rwandan classrooms.**

---

## The problem

A secondary-school teacher in Rwanda grades on average 30–40 papers per exam,
6–10 exams per term, across 4–6 classes. That's **400–800 papers per term**,
each one read by hand. A single midterm can swallow an entire weekend.

Manual grading is slow, inconsistent (the 200th paper gets less attention than
the 1st), and steals time teachers should spend teaching. There is no national
EdTech tool addressing this — teachers are still grading the way they did in
1995.

## The solution

**SmartGrade.** A teacher photographs an exam paper with their phone. Within
10 seconds they get back per-question scores, written feedback for each
short-answer and essay question, and analytics across all their classes.

Three steps:

1. **Take a photo** — phone camera or upload, both supported.
2. **The pipeline runs** — OpenCV deskews and cleans the image, bubble
   detection reads MCQ answers, Google Vision extracts handwritten text,
   Claude (Anthropic's LLM) grades each written answer against a teacher-
   defined rubric.
3. **Teacher reviews** — per-question scores with AI-written feedback, plus
   class-wide analytics (score distribution, trends over time).

## How it's different

| Existing solutions       | SmartGrade                                    |
|--------------------------|-----------------------------------------------|
| Bubble-sheet only        | Grades MCQ **and** handwritten answers        |
| Pre-printed templates    | Works on any paper — no template required     |
| Score only               | Score **plus written feedback** per question  |
| English-language focus   | Built for Rwandan classrooms first            |

The handwritten-answer grading is the differentiator. Bubble-sheet graders
have existed for 30 years; AI that reads and assesses written answers fairly
is a 2024-onwards capability we can finally ship.

## The numbers

- **Cost per scan:** ~17 RWF (mixed paper, 30 questions, 10 written).
  Pure MCQ scans are effectively free.
- **Time saved per teacher:** ~6 hours per midterm (estimate, 30 papers ×
  12 minutes each → ~10 seconds each).
- **Pricing (preview, launching post-hackathon):**
  - 🟢 **Free Trial** — 0 RWF, 3 grading attempts, MCQ + True/False + fill-in
  - 🟡 **Smart Grading** — 4,990 RWF/month, AI grading of written answers + OCR + bulk correction
  - 🔵 **Advanced AI Exam Suite** — 14,990 RWF/month, AI exam generation + batch + analytics + priority

  Payable via MTN MoMo, Airtel Money, or card.

## Status today

Working MVP. Backend, frontend, and the full grading pipeline are
implemented and wired together end-to-end:

- ✅ Auth, answer keys, scan upload, real-time grading
- ✅ Dashboard + Results + Analytics (all real data)
- ✅ Mock mode runs the full pipeline for free during development
- ⚠️ Subscription billing — UI only (post-hackathon)
- ❌ Multi-page papers, user roles, production hardening

Roughly **85% of an MVP**. The remaining 15% is mostly billing integration
and operational work, not architectural complexity.

## The ask

We are looking for:

1. **Pilot schools** — 5 willing teachers across 2 schools to use SmartGrade
   for the next term and tell us what's broken.
2. **Mentorship on go-to-market** — how does an EdTech tool actually get
   adopted in Rwandan secondary schools? District? Private schools first?
3. **Seed funding** — to cover Google Vision and Anthropic API costs during
   the pilot, plus 2 months of focused engineering on the gaps above.

---

*SmartGrade — built in Kigali, for Rwandan classrooms.*
