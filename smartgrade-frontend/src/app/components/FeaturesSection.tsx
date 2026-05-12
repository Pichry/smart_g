import { Zap, Bot, Shield, BarChart2, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-time Scanning",
    desc: "Capture and process student answer sheets instantly. No waiting — results appear as soon as the scan completes.",
    stat: "< 3s",
    statLabel: "avg. scan time",
  },
  {
    icon: Bot,
    title: "AI Instant Grading",
    desc: "Our AI engine reads every bubble, compares against your answer key, and delivers a precise score automatically.",
    stat: "99%",
    statLabel: "grading accuracy",
  },
  {
    icon: Shield,
    title: "No Image Storage",
    desc: "Scanned images are processed in memory and never stored on our servers. Student privacy is guaranteed.",
    stat: "0",
    statLabel: "images stored",
  },
  {
    icon: BarChart2,
    title: "Smart Analytics",
    desc: "Track class performance over time, spot weak questions, and identify students who need extra support.",
    stat: "10+",
    statLabel: "insight metrics",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="ds-container features-section__inner">

        {/* Header */}
        <div className="features-section__header">
          <span className="ds-badge features-section__badge">Why SmartGrade</span>
          <h2 className="features-section__title">
            Everything you need to grade<br />
            <span className="features-section__title-accent">faster and smarter</span>
          </h2>
          <p className="features-section__subtitle">
            Four core capabilities that save teachers hours every week.
          </p>
        </div>

        {/* Cards grid */}
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc, stat, statLabel }) => (
            <div key={title} className="feature-card">
              {/* top accent bar */}
              <div className="feature-card__bar" />

              {/* icon */}
              <div className="feature-card__icon-wrap">
                <Icon size={22} color="#fff" strokeWidth={2} />
              </div>

              {/* text */}
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{desc}</p>

              {/* stat */}
              <div className="feature-card__stat-row">
                <div className="feature-card__stat">
                  <span className="feature-card__stat-value">{stat}</span>
                  <span className="feature-card__stat-label">{statLabel}</span>
                </div>
                <span className="feature-card__arrow">
                  <ArrowRight size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
