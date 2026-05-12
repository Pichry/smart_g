import { useNavigate } from "react-router";
import { Play, CheckCircle, Zap, Shield, BarChart2, Bot } from "lucide-react";

const rows: boolean[][] = [
  [true,  false, false, false],
  [false, true,  false, false],
  [false, false, true,  false],
  [true,  false, false, false],
  [false, false, false, true ],
  [false, true,  false, false],
];

function PhoneMockup() {
  return (
    <div className="hero-phone">

      {/* ── Floating stat cards ── */}
      <div className="hero-phone__card hero-phone__card--tl">
        <CheckCircle size={14} color="var(--color-success)" strokeWidth={2.5} />
        <span>98% Accuracy</span>
      </div>

      <div className="hero-phone__card hero-phone__card--br">
        <Zap size={14} color="var(--color-primary)" strokeWidth={2.5} />
        <span>Instant Results</span>
      </div>

      {/* ── Floating icon badges ── */}
      <div className="hero-phone__badge hero-phone__badge--left">
        <BarChart2 size={18} color="#fff" />
      </div>
      <div className="hero-phone__badge hero-phone__badge--right">
        <Bot size={20} color="#fff" />
      </div>

      {/* ── Glow rings ── */}
      <div className="hero-phone__ring hero-phone__ring--lg" />
      <div className="hero-phone__ring hero-phone__ring--sm" />

      {/* ── Phone shell ── */}
      <div className="hero-phone__shell">
        {/* notch */}
        <div className="hero-phone__notch" />

        {/* screen */}
        <div className="hero-phone__screen">
          {/* status bar */}
          <div className="hero-phone__status">
            <span>Scanning…</span>
            <div className="hero-phone__status-dots">
              <span /><span /><span />
            </div>
          </div>

          {/* scan area */}
          <div className="hero-phone__scan-area">
            {/* corner brackets */}
            <span className="hero-phone__corner hero-phone__corner--tl" />
            <span className="hero-phone__corner hero-phone__corner--tr" />
            <span className="hero-phone__corner hero-phone__corner--bl" />
            <span className="hero-phone__corner hero-phone__corner--br" />

            {/* scanning beam */}
            <div className="hero-phone__beam" />

            {/* answer bubbles */}
            <div className="hero-phone__answers">
              {rows.map((row, i) => (
                <div key={i} className="hero-phone__row">
                  <span className="hero-phone__row-num">{i + 1}</span>
                  {row.map((filled, j) => (
                    <span
                      key={j}
                      className={`hero-phone__bubble ${filled ? "hero-phone__bubble--filled" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* score chip */}
          <div className="hero-phone__score">
            <span className="hero-phone__score-label">Score</span>
            <span className="hero-phone__score-value">
              <strong>20</strong>/34
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const trust = [
  { icon: CheckCircle, text: "No credit card required" },
  { icon: Shield,      text: "Privacy first" },
  { icon: Zap,         text: "Results in seconds" },
];

export function HeroSection() {
  const navigate  = useNavigate();

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="home" className="hero">
      {/* subtle grid bg */}
      <div className="hero__grid-bg" aria-hidden />

      {/* purple blobs */}
      <div className="hero__blob hero__blob--1" aria-hidden />
      <div className="hero__blob hero__blob--2" aria-hidden />

      <div className="hero__inner ds-container">

        {/* ── LEFT ── */}
        <div className="hero__text">
          <div className="hero__badge ds-badge">
            <Zap size={12} strokeWidth={2.5} />
            AI-Powered Grading
          </div>

          <h1 className="hero__title">
            Scan. Grade.<br />
            <span className="hero__title-accent">Done.</span>
          </h1>

          <p className="hero__subtitle">
            Instantly scan student papers and get accurate results in seconds.
            Save hours of manual grading with AI precision.
          </p>

          <div className="hero__buttons">
            <button className="hero__btn-primary" onClick={() => navigate("/auth")}>
              Get Started Free
            </button>
            <button className="hero__btn-secondary" onClick={() => scrollTo("how-it-works")}>
              <span className="hero__play-icon">
                <Play size={11} fill="var(--color-primary)" color="var(--color-primary)" />
              </span>
              Watch Demo
            </button>
          </div>

          <div className="hero__trust">
            {trust.map(({ icon: Icon, text }) => (
              <div key={text} className="hero__trust-item">
                <Icon size={14} color="var(--color-primary)" strokeWidth={2.5} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="hero__visual">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
