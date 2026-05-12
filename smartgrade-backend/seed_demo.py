"""Seed the database with a demo account for the hackathon.

Run from the backend root:

    python seed_demo.py

Idempotent: safe to run multiple times. If the demo user already exists, it
wipes and re-seeds their data so you start fresh.

Demo credentials:
    email:    demo@smartgrade.rw
    password: demo1234

After seeding, log in with those credentials and the dashboard, results, and
analytics pages will all be populated with realistic data.
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Make sure the app package is importable when run from the backend root.
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import AnswerKey, QuestionResult, Scan, User  # noqa: E402


# ─────────────────────────── demo data ────────────────────────────────────────

DEMO_EMAIL = "demo@smartgrade.rw"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo Teacher"

STUDENT_NAMES = [
    "Ishimwe Jean",     "Uwase Marie",      "Mugisha Alex",     "Habimana Sarah",
    "Niyonshuti Eric",  "Mukamana Diane",   "Nshuti David",     "Bizimana Patrick",
    "Iradukunda Grace", "Mukansanga Alice", "Hakizimana Pierre","Umutoni Linda",
    "Niyonzima Joseph", "Tuyisenge Claire", "Munyaneza Thomas",
]


def make_keys() -> list[dict]:
    """Three answer keys covering MCQ, mixed, and rubric-graded papers."""
    return [
        {
            "name": "Math Quiz — Algebra Basics",
            "subject": "Mathematics",
            "total_marks": 10,
            "is_active": False,
            "questions": [
                {"number": i + 1, "type": "mcq", "marks": 1,
                 "correct_answer": ans, "rubric": None}
                for i, ans in enumerate(
                    ["A", "C", "B", "D", "A", "B", "C", "D", "A", "B"]
                )
            ],
        },
        {
            "name": "Biology Midterm — Cells & Photosynthesis",
            "subject": "Biology",
            "total_marks": 20,
            "is_active": True,
            "source_notes": (
                "Photosynthesis is the process by which green plants and some other "
                "organisms use sunlight to synthesize foods with the help of "
                "chlorophyll. The process converts light energy into chemical energy "
                "stored in glucose. Plants take in carbon dioxide from the atmosphere "
                "and water from the soil, and release oxygen as a byproduct. The "
                "overall equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2.\n\n"
                "The cell is the basic structural and functional unit of all known "
                "organisms. Cells consist of a cell membrane (controls what enters "
                "and leaves), cytoplasm (the gel-like fluid inside), and a nucleus "
                "(contains DNA and controls cell activities). Plant cells additionally "
                "have a cell wall and chloroplasts (which contain chlorophyll and are "
                "where photosynthesis happens).\n\n"
                "The mitochondrion is known as the powerhouse of the cell. It has a "
                "double membrane: an outer membrane that is smooth, and an inner "
                "membrane folded into structures called cristae which dramatically "
                "increase the surface area for chemical reactions. The matrix is the "
                "space inside the inner membrane and contains enzymes for the Krebs "
                "cycle. Mitochondria produce ATP — the cell's energy currency — "
                "through oxidative phosphorylation in the electron transport chain "
                "embedded in the inner membrane."
            ),
            "questions": [
                {"number": 1, "type": "mcq", "marks": 1, "correct_answer": "B", "rubric": None},
                {"number": 2, "type": "mcq", "marks": 1, "correct_answer": "D", "rubric": None},
                {"number": 3, "type": "mcq", "marks": 1, "correct_answer": "A", "rubric": None},
                {"number": 4, "type": "mcq", "marks": 1, "correct_answer": "C", "rubric": None},
                {"number": 5, "type": "mcq", "marks": 1, "correct_answer": "B", "rubric": None},
                {
                    "number": 6, "type": "short", "marks": 5,
                    "correct_answer": (
                        "Photosynthesis converts light energy into chemical "
                        "energy stored in glucose. Plants take in carbon "
                        "dioxide and water and release oxygen as a byproduct."
                    ),
                    "rubric": (
                        "1 mark: light → chemical energy. 1 mark: glucose. "
                        "1 mark: CO2 input. 1 mark: water input. 1 mark: O2 output."
                    ),
                },
                {
                    "number": 7, "type": "long", "marks": 10,
                    "correct_answer": (
                        "The mitochondrion is the powerhouse of the cell. It has "
                        "an outer membrane, an inner membrane folded into cristae "
                        "to increase surface area, and a matrix where the Krebs "
                        "cycle occurs. The electron transport chain on the inner "
                        "membrane produces ATP via oxidative phosphorylation."
                    ),
                    "rubric": (
                        "Up to 3 marks for structure (membranes, cristae, matrix). "
                        "Up to 4 marks for function (ATP, Krebs, ETC). "
                        "Up to 3 marks for clarity and accuracy."
                    ),
                },
            ],
        },
        {
            "name": "History Test — Pre-colonial Rwanda",
            "subject": "History",
            "total_marks": 15,
            "is_active": False,
            "questions": [
                {"number": 1, "type": "mcq", "marks": 1, "correct_answer": "A", "rubric": None},
                {"number": 2, "type": "mcq", "marks": 1, "correct_answer": "B", "rubric": None},
                {"number": 3, "type": "mcq", "marks": 1, "correct_answer": "D", "rubric": None},
                {
                    "number": 4, "type": "short", "marks": 6,
                    "correct_answer": (
                        "The Mwami was the king of pre-colonial Rwanda, holding "
                        "supreme political and spiritual authority. Power was "
                        "organised through chiefs of land, cattle, and army."
                    ),
                    "rubric": "2 marks role of Mwami. 4 marks structure of chiefs.",
                },
                {
                    "number": 5, "type": "long", "marks": 6,
                    "correct_answer": (
                        "Pre-colonial Rwanda had a centralised monarchy under the "
                        "Mwami, with a complex system of land tenure (Ubukonde), "
                        "patron-client relationships (Ubuhake), and military "
                        "organisation. Society was stratified but with social "
                        "mobility through service to the king."
                    ),
                    "rubric": (
                        "2 marks monarchy. 2 marks land/cattle systems. "
                        "2 marks society and mobility."
                    ),
                },
            ],
        },
    ]


# ─────────────────────────── placeholder image ────────────────────────────────

# Smallest valid JPEG — gray pixel. Used as a stand-in image so deleting a
# scan and viewing one don't crash on missing files.
PLACEHOLDER_JPEG = bytes.fromhex(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707"
    "07090908"
    "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c"
    "30313434"
    "1f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232"
    "32323232"
    "32323232323232323232323232323232323232323232323232323232323232323232"
    "32323232"
    "ffc00011080001000103012200021101031101ffc4001f00000105010101010101"
    "0000000000000000010203040506070809000a0bffc400b51000020103030204"
    "0305050404000001"
    "7d010203000411051221314106135161072271143281914aa1b1c109233352f0156272d1"
    "0a162434"
    "e125f11718191a262728292a35363738393a434445464748494a535455565758595a6364"
    "65666768"
    "696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aa"
    "b2b3b4b5"
    "b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3"
    "f4f5f6f7"
    "f8f9faffc4001f0100030101010101010101010100000000000001020304050607080900"
    "0a0bffc4"
    "00b51100020102040403040705040400010277000102031104052131061241510761711"
    "32232081"
    "44914a1b1c109233352f0156272d10a162434e125f11718191a262728292a3536373839"
    "3a4344454"
    "64748494a535455565758595a636465666768696a737475767778797a8283848586878"
    "88990a2a3a"
    "4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3"
    "e4e5e6e7"
    "e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00fbfcfb00ffd9"
)


def write_placeholder(user_id: int) -> str:
    """Write the shared placeholder JPEG for the demo user."""
    rel = Path("scans") / str(user_id) / "demo_placeholder.jpg"
    full = Path(settings.UPLOAD_DIR) / rel
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_bytes(PLACEHOLDER_JPEG)
    return str(rel)


# ─────────────────────────── scan generation ──────────────────────────────────

def make_scans(user: User, keys: list[AnswerKey], image_rel: str) -> list[Scan]:
    """Generate ~14 graded scans spread across the last 30 days."""
    rng = random.Random(42)  # deterministic so the same demo every time
    scans: list[Scan] = []
    now = datetime.now(timezone.utc)

    # Roughly 14 scans, weighted towards the more recent past.
    days_back = [1, 2, 3, 4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 29]

    for i, days_ago in enumerate(days_back):
        student = STUDENT_NAMES[i % len(STUDENT_NAMES)]
        student_id = f"4{6780 + i:04d}"
        key = keys[rng.choice([0, 1, 1, 1, 2])]  # bias to the biology key

        created = now - timedelta(days=days_ago, hours=rng.randint(0, 23))

        # Pick a target percentage for this paper. Most students score 50–85.
        target_pct = rng.choices(
            [35, 50, 60, 65, 70, 75, 80, 85, 92],
            weights=[1, 2, 3, 3, 4, 4, 3, 2, 1],
            k=1,
        )[0]

        # Build per-question results that approximate that target.
        results: list[QuestionResult] = []
        awarded_total = 0.0
        possible_total = 0
        for q in key.questions:
            possible_total += q["marks"]
            # Each question independently hits the target ± 20% noise.
            roll = rng.random() * 100
            if q["type"] == "mcq":
                got_it = roll < target_pct
                marks = q["marks"] if got_it else 0
                student_ans = q["correct_answer"] if got_it else _wrong_letter(
                    q["correct_answer"], rng
                )
                fb = None
            else:
                # Written: graded LLM-style with partial credit.
                fraction = max(0, min(1, (target_pct + rng.uniform(-15, 15)) / 100))
                marks = round(q["marks"] * fraction, 1)
                student_ans = _summarise_answer(q["correct_answer"], fraction, rng)
                fb = _make_feedback(fraction, q["marks"], marks)
            awarded_total += marks
            results.append(
                QuestionResult(
                    question_number=q["number"],
                    question_type=q["type"],
                    marks_possible=q["marks"],
                    marks_awarded=marks,
                    correct_answer=q["correct_answer"],
                    student_answer=student_ans,
                    feedback=fb,
                    raw=None,
                )
            )

        scan = Scan(
            student_name=student,
            student_id=student_id,
            exam_label=key.name,
            image_path=image_rel,
            status="completed",
            score=int(round(awarded_total)),
            total_marks=possible_total,
            percentage=round(100 * awarded_total / possible_total, 2),
            created_at=created,
            completed_at=created + timedelta(seconds=rng.randint(8, 30)),
            owner_id=user.id,
            answer_key_id=key.id,
            results=results,
        )
        scans.append(scan)

    return scans


def _wrong_letter(correct: str, rng: random.Random) -> str:
    return rng.choice([c for c in "ABCD" if c != correct])


def _summarise_answer(model_answer: str, fraction: float, rng: random.Random) -> str:
    """Build a plausible student answer that's roughly `fraction` complete."""
    sentences = [s.strip() for s in model_answer.split(".") if s.strip()]
    take = max(1, int(round(len(sentences) * fraction)))
    chosen = sentences[:take]
    text = ". ".join(chosen)
    if fraction < 0.4:
        return text + " (incomplete)"
    if fraction < 0.7:
        return text + "."
    return text + ". " + (sentences[-1] if take < len(sentences) else "")


def _make_feedback(fraction: float, possible: int, awarded: float) -> str:
    if fraction >= 0.85:
        return f"Excellent — covered all the key points. {awarded}/{possible} marks."
    if fraction >= 0.6:
        return f"Good answer with most key ideas. Missed some detail. {awarded}/{possible} marks."
    if fraction >= 0.3:
        return f"Partial answer — missing several key concepts. {awarded}/{possible} marks."
    return f"Limited answer. Review the topic and try again. {awarded}/{possible} marks."


# ─────────────────────────── main ─────────────────────────────────────────────

def main() -> None:
    # If the old DB is missing the new columns (User.plan, Scan.image_paths),
    # drop and recreate. SQLAlchemy's create_all doesn't add columns to
    # existing tables.
    from sqlalchemy import inspect
    insp = inspect(engine)
    needs_rebuild = False
    if insp.has_table("users") and "plan" not in {c["name"] for c in insp.get_columns("users")}:
        needs_rebuild = True
    if insp.has_table("scans") and "image_paths" not in {c["name"] for c in insp.get_columns("scans")}:
        needs_rebuild = True
    if insp.has_table("answer_keys") and "source_notes" not in {c["name"] for c in insp.get_columns("answer_keys")}:
        needs_rebuild = True

    if needs_rebuild:
        print("⚠️  Schema is out of date. Dropping and recreating tables...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Wipe any existing demo user (cascade to keys and scans).
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"Demo user already exists. Resetting their data...")
            db.delete(existing)
            db.commit()

        user = User(
            full_name=DEMO_NAME,
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            plan="advanced",  # demo gets the top tier so judges see everything
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        image_rel = write_placeholder(user.id)

        keys: list[AnswerKey] = []
        for spec in make_keys():
            k = AnswerKey(
                owner_id=user.id,
                name=spec["name"],
                subject=spec["subject"],
                total_marks=spec["total_marks"],
                exam_code=spec.get("exam_code"),
                exam_title=spec.get("exam_title"),
                teacher_name=spec.get("teacher_name"),
                is_active=spec["is_active"],
                questions=spec["questions"],
                source_notes=spec.get("source_notes"),
                generation_prompt=spec.get("generation_prompt"),
            )
            db.add(k)
            db.commit()
            db.refresh(k)
            keys.append(k)

        scans = make_scans(user, keys, image_rel)
        for s in scans:
            db.add(s)
        db.commit()

        print()
        print("✅ Seeded the database with a demo account.")
        print(f"   Email:    {DEMO_EMAIL}")
        print(f"   Password: {DEMO_PASSWORD}")
        print(f"   Keys:     {len(keys)}")
        print(f"   Scans:    {len(scans)} (spread over the last 30 days)")
        print()
        print("Log in at http://localhost:5173/auth and you'll see populated")
        print("Dashboard, Results, and Analytics pages.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
