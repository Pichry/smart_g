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

export function DkNavbar() {
  const navigate = useNavigate();
  const [scrolled,  setScrolled]  = useState(false);
  const [activeId,  setActiveId]  = useState("home");
  const [menuOpen,  setMenuOpen]  = useState(false);

  /* solidify background after 8px scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* highlight active section */
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
    <nav className="dk-navbar" data-scrolled={scrolled}>
      <div className="dk-navbar__inner dk-container">

        {/* Logo */}
        <button className="dk-navbar__logo" onClick={() => scrollTo("home")}>
          <span className="dk-navbar__logo-icon">
            <GraduationCap size={18} strokeWidth={2.5} color="#fff" />
          </span>
          <span className="dk-navbar__logo-text">SmartGrade</span>
        </button>

        {/* Desktop links */}
        <ul className="dk-navbar__links">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button
                className="dk-navbar__link"
                data-active={activeId === id}
                onClick={() => scrollTo(id)}
              >
                {label}
                <span className="dk-navbar__link-dot" />
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="dk-navbar__actions">
          <button className="dk-navbar__login" onClick={() => navigate("/auth")}>
            Log In
          </button>
          <button className="dk-navbar__cta" onClick={() => navigate("/auth")}>
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="dk-navbar__hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className="dk-navbar__drawer" data-open={menuOpen}>
        <ul className="dk-navbar__drawer-links">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button
                className="dk-navbar__drawer-link"
                data-active={activeId === id}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="dk-navbar__drawer-actions">
          <button
            className="dk-navbar__login"
            style={{ width: "100%" }}
            onClick={() => { navigate("/auth"); setMenuOpen(false); }}
          >
            Log In
          </button>
          <button
            className="dk-navbar__cta"
            style={{ width: "100%" }}
            onClick={() => { navigate("/auth"); setMenuOpen(false); }}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
