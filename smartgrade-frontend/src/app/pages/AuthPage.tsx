import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  GraduationCap, Eye, EyeOff, ArrowRight,
  CheckCircle2, BarChart2, Bot, Shield, Building2, AlertCircle,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";

const features = [
  { icon: BarChart2,    text: "Instant grading results" },
  { icon: Bot,          text: "AI-powered answer analysis" },
  { icon: Shield,       text: "No image storage — privacy first" },
  { icon: CheckCircle2, text: "Real-time analytics dashboard" },
];

type Tab = "signin" | "signup" | "org";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  const [tab,          setTab]          = useState<Tab>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Form fields — kept here so we don't lose values when switching tabs
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Where to bounce to after login. ProtectedRoute set this when it
  // redirected an unauthenticated user — otherwise default to /app.
  const redirectTo = (location.state as { from?: { pathname: string } } | null)
    ?.from?.pathname || "/app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Org SSO not implemented on the backend yet — short-circuit gracefully.
    if (tab === "org") {
      setError("Organisation SSO is not available yet. Use Sign In or Sign Up.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "signin") {
        await login(email, password);
      } else {
        await signup(fullName, email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const headings: Record<Tab, { title: string; sub: string }> = {
    signin: { title: "Welcome back",    sub: "Sign in to your account to continue" },
    signup: { title: "Create account",  sub: "Start grading smarter today" },
    org:    { title: "Organisation SSO", sub: "Sign in with your organisation email" },
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#0F0A2E" }}>
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(139,92,246,0.12)", transform: "translate(25%,-25%)" }} />
        <div className="absolute left-0 bottom-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(139,92,246,0.08)", transform: "translate(-25%,25%)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">SmartGrade</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-2">Scan. Grade.</h1>
          <h1 className="text-5xl font-extrabold leading-tight mb-6" style={{ color: "#8B5CF6" }}>Done.</h1>
          <p className="text-lg leading-relaxed mb-10 max-w-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Smart Digital Paper Correction System uses AI to scan student papers and deliver accurate results in seconds.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#C4B5FD" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl p-5"
          style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.20)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "rgba(139,92,246,0.35)" }}>U</div>
            <div>
              <p className="text-white text-sm font-semibold">Teacher Uwimana</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Kigali Secondary School</p>
            </div>
          </div>
          <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.75)" }}>
            "I used to spend 3 hours grading. Now it takes 15 minutes. This tool is a game changer."
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6"
        style={{ background: "var(--color-section-bg)" }}>
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>SmartGrade</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-soft)" }}>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                {headings[tab].title}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {headings[tab].sub}
              </p>
            </div>

            {/* 3-tab switcher */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: "var(--color-section-bg)" }}>
              {([
                { key: "signin" as Tab, label: "Sign In" },
                { key: "signup" as Tab, label: "Sign Up" },
                { key: "org"    as Tab, label: "Organisation" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setError(null); }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    background: tab === key ? "var(--color-primary)" : "transparent",
                    color:      tab === key ? "#fff" : "var(--color-text-secondary)",
                    boxShadow:  tab === key ? "0 2px 8px rgba(108,92,231,0.3)" : "none",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm animate-fade-in"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#b91c1c" }}>
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Organisation SSO ── */}
              {tab === "org" && (
                <div className="animate-slide-up space-y-4">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)" }}>
                    <Building2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      Enter your organisation email address. We'll detect your SSO provider and redirect you automatically.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                      Organisation Email
                    </label>
                    <input
                      type="email"
                      className="app-input"
                      placeholder="you@yourschool.edu"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                    style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(108,92,231,0.35)" }}
                    onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--color-primary-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}>
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Building2 size={16} />Continue with Organisation</>
                    }
                  </button>
                </div>
              )}

              {/* ── Sign In / Sign Up ── */}
              {tab !== "org" && (
                <>
                  {tab === "signup" && (
                    <div className="animate-slide-up">
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>Full Name</label>
                      <input type="text" className="app-input" placeholder="e.g. Uwimana Jean"
                        value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>Email address</label>
                    <input type="email" className="app-input" placeholder="you@school.edu"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Password</label>
                      {tab === "signin" && (
                        <button type="button" className="text-xs transition-colors"
                          style={{ color: "var(--color-primary)" }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="app-input pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 mt-2"
                    style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(108,92,231,0.35)" }}
                    onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--color-primary-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}>
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><ArrowRight className="w-4 h-4" />{tab === "signin" ? "Sign In" : "Create Account"}</>
                    }
                  </button>

                  {/* Divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 text-xs" style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)" }}>
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* Try with demo account — one-tap sign-in for judges/visitors. */}
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setLoading(true);
                      try {
                        await login("demo@smartgrade.rw", "demo1234");
                        navigate(redirectTo, { replace: true });
                      } catch {
                        setError("Demo account not seeded yet. Run `python seed_demo.py` in the backend.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
                    <span style={{ color: "var(--color-primary)" }}>✨</span>
                    Try with demo account
                  </button>
                </>
              )}
            </form>

            <p className="text-center text-xs mt-5" style={{ color: "var(--color-text-secondary)" }}>
              By continuing, you agree to our{" "}
              <span className="cursor-pointer" style={{ color: "var(--color-primary)" }}>Terms</span> and{" "}
              <span className="cursor-pointer" style={{ color: "var(--color-primary)" }}>Privacy Policy</span>
            </p>
          </div>

          {tab !== "org" && (
            <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-secondary)" }}>
              {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
                className="font-medium transition-colors"
                style={{ color: "var(--color-primary)" }}>
                {tab === "signin" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
