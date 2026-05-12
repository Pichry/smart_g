import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home",         id: "home" },
  { label: "Features",     id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing",      id: "pricing" },
  { label: "Contact",      id: "contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const [scrolled,    setScrolled]    = useState(false);
  const [activeId,    setActiveId]    = useState("home");
  const [menuOpen,    setMenuOpen]    = useState(false);

  /* ── shadow on scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── active link via IntersectionObserver ── */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    navLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className="navbar" data-scrolled={scrolled}>
      <div className="navbar__inner ds-container">

        {/* ── Logo ── */}
        <button className="navbar__logo" onClick={() => scrollTo("home")}>
          <span className="navbar__logo-icon">
            <GraduationCap size={18} strokeWidth={2.5} color="#fff" />
          </span>
          <span className="navbar__logo-text">SmartGrade</span>
        </button>

        {/* ── Desktop links ── */}
        <ul className="navbar__links">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button
                className="navbar__link"
                data-active={activeId === id}
                onClick={() => scrollTo(id)}
              >
                {label}
                <span className="navbar__link-dot" />
              </button>
            </li>
          ))}
        </ul>

        {/* ── Desktop actions ── */}
        <div className="navbar__actions">
          <button className="navbar__login" onClick={() => navigate("/auth")}>
            Log In
          </button>
          <button className="navbar__cta" onClick={() => navigate("/auth")}>
            Get Started
          </button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <div className="navbar__drawer" data-open={menuOpen}>
        <ul className="navbar__drawer-links">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button
                className="navbar__drawer-link"
                data-active={activeId === id}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="navbar__drawer-actions">
          <button className="navbar__login" style={{ width: "100%" }} onClick={() => { navigate("/auth"); setMenuOpen(false); }}>
            Log In
          </button>
          <button className="navbar__cta" style={{ width: "100%" }} onClick={() => { navigate("/auth"); setMenuOpen(false); }}>
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
