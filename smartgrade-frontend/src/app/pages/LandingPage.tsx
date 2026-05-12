import { useState } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap, ArrowRight, ScanLine, Brain,
  CheckCircle, Facebook, Twitter, Instagram, Zap,
} from "lucide-react";
import { Container } from "../components/ui";
import { Navbar }            from "../components/Navbar";
import { HeroSection }       from "../components/HeroSection";
import { FeaturesSection }   from "../components/FeaturesSection";
import { DemoResultsSection } from "../components/DemoResultsSection";

const howItWorks = [
  {
    icon: ScanLine, step: 1,
    title: "Scan Paper",
    desc: "Scan student answer sheets using your phone or upload directly from your device.",
  },
  {
    icon: Brain, step: 2,
    title: "AI Reads Answers",
    desc: "Our AI reads and understands every answer bubble using advanced computer vision.",
  },
  {
    icon: CheckCircle, step: 3,
    title: "Get Instant Score",
    desc: "Receive accurate results, detailed feedback, and performance analytics instantly.",
  },
];

const footerLinks = {
  Product:  ["Features", "How It Works", "Pricing"],
  Company:  ["About Us", "Blog", "Contact"],
  Support:  ["Help Center", "Terms of Service", "Privacy Policy"],
};

export function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="lp-root">
      <Navbar />
      <HeroSection />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="lp-hiw">
        <Container style={{ maxWidth: "1060px" }}>
          <div className="lp-hiw__header">
            <span className="ds-badge"><Zap size={11} strokeWidth={2.5} />How It Works</span>
            <h2 className="lp-hiw__title">Three steps to smarter grading</h2>
            <p className="lp-hiw__subtitle">From paper to results in under 10 seconds.</p>
          </div>

          <div className="lp-hiw__grid">
            {howItWorks.map(({ icon: Icon, step, title, desc }, i) => (
              <div key={title} className="lp-hiw__card">
                <div className="lp-hiw__step-num">{step}</div>
                <div className="lp-hiw__icon-wrap">
                  <Icon size={26} strokeWidth={1.5} color="var(--color-primary)" />
                </div>
                <h3 className="lp-hiw__card-title">{title}</h3>
                <p className="lp-hiw__card-desc">{desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="lp-hiw__connector" aria-hidden>
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <FeaturesSection />
      <DemoResultsSection />

      {/* ── CTA BANNER ── */}
      <section id="pricing" className="lp-cta">
        <div className="lp-cta__glow" aria-hidden />
        <Container style={{ maxWidth: "1060px" }}>
          <div className="lp-cta__inner">
            <div className="lp-cta__text">
              <h2 className="lp-cta__title">Start Grading Smarter Today</h2>
              <p className="lp-cta__sub">Join thousands of teachers saving hours every week with AI.</p>
            </div>
            <button className="lp-cta__btn" onClick={() => navigate("/auth")}>
              Get Started Free <ArrowRight size={16} />
            </button>
          </div>
        </Container>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" className="lp-footer">
        <Container style={{ maxWidth: "1200px" }}>
          <div className="lp-footer__grid">

            {/* Brand */}
            <div className="lp-footer__brand">
              <div className="lp-footer__logo">
                <div className="lp-footer__logo-icon">
                  <GraduationCap size={18} color="#fff" />
                </div>
                <span className="lp-footer__logo-text">SmartGrade</span>
              </div>
              <p className="lp-footer__tagline">
                Making grading simple, fast, and smarter with AI.
              </p>
              <div className="lp-footer__socials">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <button key={i} className="lp-footer__social-btn" aria-label="Social link">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="lp-footer__col">
                <h4 className="lp-footer__col-heading">{heading}</h4>
                <ul className="lp-footer__col-links">
                  {links.map((item) => (
                    <li key={item}>
                      <button
                        className="lp-footer__link"
                        onClick={() => scrollTo(item.toLowerCase().replace(/ /g, "-"))}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div className="lp-footer__col">
              <h4 className="lp-footer__col-heading">Newsletter</h4>
              <p className="lp-footer__newsletter-desc">Get updates and grading tips.</p>
              <div className="lp-footer__newsletter-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="lp-footer__newsletter-input"
                />
                <button className="lp-footer__newsletter-btn">Subscribe</button>
              </div>
            </div>
          </div>

          <div className="lp-footer__bottom">
            <p>© {new Date().getFullYear()} SmartGrade. All rights reserved.</p>
            <div className="lp-footer__bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
