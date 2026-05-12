import { useNavigate } from "react-router";
import { Check, X, CheckCircle, TrendingUp, Users } from "lucide-react";

const questions = [
  { label: "Q1", correct: true,  answer: "A", note: "Correct answer" },
  { label: "Q2", correct: false, answer: "C", note: "Expected B"     },
  { label: "Q3", correct: true,  answer: "C", note: "Correct answer" },
];

const highlights = [
  { icon: CheckCircle, value: "20 / 34", sub: "Total score"       },
  { icon: TrendingUp,  value: "59%",     sub: "Percentage"        },
  { icon: Users,       value: "< 3s",    sub: "Time to grade"     },
];

export function DemoResultsSection() {
  const navigate = useNavigate();

  return (
    <section className="demo-results">
      <div className="ds-container demo-results__inner">

        {/* ── LEFT — result card ── */}
        <div className="demo-results__card-wrap">
          <div className="demo-results__card">

            {/* card header */}
            <div className="demo-results__card-header">
              <div className="demo-results__avatar">I</div>
              <div className="demo-results__student">
                <span className="demo-results__student-name">Ishimwe</span>
                <span className="demo-results__student-id">ID: 46784</span>
              </div>
              <div className="demo-results__badge-wrap">
                <span className="demo-results__exam-badge">Math Midterm</span>
              </div>
            </div>

            {/* score */}
            <div className="demo-results__score-block">
              <div className="demo-results__score">
                <span className="demo-results__score-num">20</span>
                <span className="demo-results__score-denom"> / 34</span>
              </div>
              <span className="demo-results__score-label">Total Score</span>
            </div>

            {/* progress bar */}
            <div className="demo-results__progress-wrap">
              <div className="demo-results__progress-track">
                <div className="demo-results__progress-fill" style={{ width: "59%" }} />
              </div>
              <span className="demo-results__progress-pct">59%</span>
            </div>

            {/* divider */}
            <div className="demo-results__divider" />

            {/* breakdown label */}
            <p className="demo-results__breakdown-label">Question Breakdown</p>

            {/* question rows */}
            <div className="demo-results__rows">
              {questions.map((q) => (
                <div key={q.label} className="demo-results__row">
                  <span className="demo-results__row-q">{q.label}</span>

                  <span className={`demo-results__row-answer ${q.correct ? "demo-results__row-answer--correct" : "demo-results__row-answer--wrong"}`}>
                    {q.answer}
                  </span>

                  <span className="demo-results__row-note">{q.note}</span>

                  <span className={`demo-results__row-icon ${q.correct ? "demo-results__row-icon--correct" : "demo-results__row-icon--wrong"}`}>
                    {q.correct
                      ? <Check size={13} strokeWidth={3} />
                      : <X     size={13} strokeWidth={3} />
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* mini stats */}
            <div className="demo-results__stats">
              {highlights.map(({ icon: Icon, value, sub }) => (
                <div key={sub} className="demo-results__stat">
                  <Icon size={14} color="var(--color-primary)" strokeWidth={2} />
                  <span className="demo-results__stat-value">{value}</span>
                  <span className="demo-results__stat-sub">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* decorative glow behind card */}
          <div className="demo-results__glow" aria-hidden />
        </div>

        {/* ── RIGHT — copy ── */}
        <div className="demo-results__copy">
          <span className="ds-badge">Live Demo</span>

          <h2 className="demo-results__heading">
            See results<br />
            <span className="demo-results__heading-accent">in seconds</span>
          </h2>

          <p className="demo-results__body">
            The moment a paper is scanned, SmartGrade reads every answer bubble,
            compares it against your key, and produces a full breakdown — score,
            per-question status, and performance percentage — instantly.
          </p>

          <ul className="demo-results__list">
            {[
              "Per-question correct / incorrect status",
              "Automatic percentage calculation",
              "Exportable results history",
            ].map((item) => (
              <li key={item} className="demo-results__list-item">
                <span className="demo-results__list-check">
                  <Check size={11} strokeWidth={3} color="#fff" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button
            className="demo-results__cta"
            onClick={() => navigate("/auth")}
          >
            Try It Now
          </button>
        </div>

      </div>
    </section>
  );
}
