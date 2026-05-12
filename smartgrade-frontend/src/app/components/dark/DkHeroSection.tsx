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

function DkPhoneMockup() {
  return (
    <div className="dk-phone">

      {/* glow rings */}
      <div className="dk-phone__ring dk-phone__ring--lg" />
      <div className="dk-phone__ring dk-phone__ring--sm" />

      {/* floating stat cards */}
      <div className="dk-phone__stat dk-phone__stat--tl">
        <CheckCircle size={13} color="#22C55E" strokeWidth={2.5} />
        <span>98% Accuracy</span>
      </div>
      <div className="dk-phone__stat dk-phone__stat--br">
        <Zap size={13} color="#C4B5FD" strokeWidth={2.5} />
        <span>Instant Results</span>
      </div>

      {/* floating icon badges */}
      <div className="dk-phone__badge dk-phone__badge--left">
        <BarChart2 size={17} color="#fff" />
      </div>
      <div className="dk-phone__badge dk-phone__badge--right">
        <Bot size={19} color="#fff" />
      </div>

      {/* phone shell */}
      <div className="dk-phone__shell">
        <div className="dk-phone__notch" />

        <div className="dk-phone__screen">
          {/* status bar */}
          <div className="dk-phone__status">
            <span>Scanning…</span>
            <div className="dk-phone__status-dots">
              <span /><span /><span />
            </div>
          </div>

          {/* scan area */}
          <div className="dk-phone__scan-area">
            {/* corner brackets */}
            <span className="dk-phone__corner dk-phone__corner--tl" />
            <span className="dk-phone__corner dk-phone__corner--tr" />
            <span className="dk-phone__corner dk-phone__corner--bl" />
            <span className="dk-phone__corner dk-phone__corner--br" />

            {/* glowing scan beam */}
            <div className="dk-phone__beam" />

            {/* answer bubbles */}
            <div className="dk-phone__answers">
              {rows.map((row, i) => (
                <div key={i} className="dk-phone__row">
                  <span className="dk-phone__row-num">{i + 1}</span>
                  {row.map((filled, j) => (
                    <span
                      key={j}
                      className={`dk-phone__bubble ${filled ? "dk-phone__bubble--filled" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* score chip */}
          <div className="dk-phone__score">
            <span className="dk-phone__score-label">Score</span>
            <span className="dk-phone__score-value">
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
  { icon: Shield,      text: "Privacy first"           },
  { icon: Zap,         text: "Results in seconds"      },
];

export function DkHeroSection() {
  const navigate = useNavigate();
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="home" className="dk-hero">
      {/* dot-grid overlay */}
      <div className="dk-hero__grid" aria-hidden />

      {/* ambient blobs */}
      <div className="dk-hero__blob dk-hero__blob--1" aria-hidden />
      <div className="dk-hero__blob dk-hero__blob--2" aria-hidden />
      <div className="dk-hero__blob dk-hero__blob--3" aria-hidden />

      <div className="dk-hero__inner dk-container">

        {/* LEFT */}
        <div className="dk-hero__text">
          <div className="dk-badge">
            <Zap size={11} strokeWidth={2.5} />
            AI-Powered Grading
          </div>

          <h1 className="dk-hero__title">
            Scan. Grade.<br />
            <span className="dk-hero__title-accent">Done.</span>
          </h1>

          <p className="dk-hero__subtitle">
            Instantly scan student papers and get accurate results in seconds.
            Save hours of manual grading with AI precision.
          </p>

          <div className="dk-hero__buttons">
            <button className="dk-btn dk-btn--primary dk-btn--lg" onClick={() => navigate("/auth")}>
              Get Started Free
            </button>
            <button className="dk-hero__btn-outline" onClick={() => scrollTo("how-it-works")}>
              <span className="dk-hero__play-ring">
                <Play size={11} fill="#8B5CF6" color="#8B5CF6" />
              </span>
              Watch Demo
            </button>
          </div>

          <div className="dk-hero__trust">
            {trust.map(({ icon: Icon, text }) => (
              <div key={text} className="dk-hero__trust-item">
                <Icon size={13} color="#8B5CF6" strokeWidth={2.5} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="dk-hero__visual">
          <DkPhoneMockup />
        </div>
      </div>
    </section>
  );
}
