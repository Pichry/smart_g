import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  Check, Zap, Sparkles, Crown, Plus, Info, CheckCircle2,
} from "lucide-react";
import { ApiError, type PlanName } from "../lib/api";
import { usePlan } from "../lib/PlanContext";

interface Plan {
  id: PlanName;
  name: string;
  tagline: string;
  price: string;          // display string
  period: string;         // "/ month", "forever", etc.
  accent: string;         // hex / css colour
  icon: React.ElementType;
  highlight?: boolean;    // "Most popular" treatment
  bestFor: string;
  features: string[];
}

// Prices in RWF — tune these as needed. They're conservative defaults
// based on ~17 RWF per mixed-paper scan + comfortable margin.
const plans: Plan[] = [
  {
    id: "free",
    name: "Free Trial",
    tagline: "Try before you commit",
    price: "0 RWF",
    period: "forever",
    accent: "#6B7280",
    icon: Sparkles,
    bestFor: "First-time users testing the system",
    features: [
      "3 free grading attempts",
      "MCQ, True/False, and fill-in-the-gaps auto-marking",
      "Answer comparison via answer-key ID",
      "Instant scoring + basic results",
      "Limited exam creation tools",
    ],
  },
  {
    id: "smart",
    name: "Smart Grading",
    tagline: "AI-powered marking with teacher control",
    price: "4,990 RWF",
    period: "/ month",
    accent: "#6C5CE7",
    icon: Zap,
    highlight: true,
    bestFor: "Teachers and schools needing automated grading support",
    features: [
      "Everything in Free Trial",
      "Upload teacher notes and answer keys",
      "AI grading of descriptive answers",
      "OCR for scanned / handwritten sheets",
      "Concept-based semantic marking",
      "Partial marking for partial answers",
      "Basic exam creation tools",
      "Bulk correction (limited)",
    ],
  },
  {
    id: "advanced",
    name: "Advanced AI Exam Suite",
    tagline: "Full intelligent exam and grading system",
    price: "14,990 RWF",
    period: "/ month",
    accent: "#0A84FF",
    icon: Crown,
    bestFor: "Institutions, schools, and high-volume environments",
    features: [
      "Everything in Smart Grading",
      "Unlimited exam creation and management",
      "AI-generated questions from your notes",
      "Advanced AI grading with reference material",
      "Full OCR for bulk scanned scripts",
      "Batch correction across many students",
      "Performance analytics + student reports",
      "Detailed feedback per question",
      "Priority processing speed",
    ],
  },
];

const addons = [
  { name: "Extra AI grading credits",          desc: "Top up beyond your monthly quota" },
  { name: "Additional storage for exam papers",desc: "Long-term archive of scanned scripts" },
  { name: "API access for school systems",     desc: "Integrate with your existing LMS" },
  { name: "Custom grading rules",              desc: "Build rubrics that match your standards" },
];

export function SubscriptionPage() {
  const { plan: planInfo, upgrade } = usePlan();
  const [notice, setNotice] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<PlanName | null>(null);

  const handleSelect = async (plan: Plan) => {
    if (planInfo?.plan === plan.id) return;
    setUpgrading(plan.id);
    setNotice(null);
    try {
      await upgrade(plan.id);
      // Read the updated capabilities from context to compose the message.
      // (The context's `plan` field will reflect the new state on next render.)
      const unlocked: string[] = [];
      if (plan.id === "smart" || plan.id === "advanced") {
        unlocked.push("written-answer AI grading", "AI question generation");
      }
      if (plan.id === "smart") unlocked.push("3-page papers");
      if (plan.id === "advanced") unlocked.push("5-page papers", "priority processing");
      const msg = plan.id === "free"
        ? "Switched back to Free Trial — written grading, AI generation, and multi-page papers are now locked."
        : `Welcome to ${plan.name}! Unlocked: ${unlocked.join(", ")}. (Real payment integration launches after the hackathon.)`;
      setNotice(msg);
      window.setTimeout(() => setNotice(null), 6000);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not switch plans");
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-slide-up">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          Choose your plan
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Start free, upgrade when you're ready. Pay in RWF via mobile money or card.
        </p>
      </div>

      <div
        className="mb-8 p-4 rounded-xl flex items-start gap-3 text-sm"
        style={{
          background: "rgba(108,92,231,0.06)",
          border: "1px solid rgba(108,92,231,0.2)",
        }}
      >
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
        <div>
          <strong style={{ color: "var(--color-text-primary)" }}>Preview pricing.</strong>{" "}
          <span style={{ color: "var(--color-text-secondary)" }}>
            Plans flip immediately for the demo — real mobile-money and card payment is on the way.
            {planInfo?.plan === "free" && (
              <> Free Trial usage: <strong>{planInfo.free_scans_used}/{planInfo.free_scans_limit}</strong>.</>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = planInfo?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all ${plan.highlight ? "shadow-lg" : ""}`}
              style={{
                background: "var(--color-bg)",
                border: plan.highlight ? `2px solid ${plan.accent}` : "1px solid var(--color-border)",
                transform: plan.highlight ? "translateY(-4px)" : undefined,
              }}
            >
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                    style={{ background: plan.accent, color: "#fff" }}>
                    Most popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                    style={{
                      background: "#22C55E",
                      color: "#fff",
                    }}>
                    <CheckCircle2 className="w-3 h-3" /> Current plan
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="inline-flex p-2 rounded-xl mb-3"
                  style={{ background: `${plan.accent}1A`, color: plan.accent }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                  {plan.name}
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-5 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
                    <span style={{ color: "var(--color-text-primary)" }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs mb-4 italic" style={{ color: "var(--color-text-tertiary)" }}>
                Best for: {plan.bestFor}
              </p>

              <Button
                onClick={() => handleSelect(plan)}
                disabled={isCurrent || upgrading === plan.id}
                loading={upgrading === plan.id}
                variant={plan.highlight && !isCurrent ? "primary" : isCurrent ? "outline" : "secondary"}
                className="w-full"
              >
                {isCurrent ? "Current plan" : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {notice && (
        <div
          className="mb-8 p-3 rounded-xl text-sm text-center animate-fade-in"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#15803d",
          }}
        >
          {notice}
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Optional add-ons
          </h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--color-section-bg)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}>
            Available later
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addons.map((a) => (
            <div key={a.name} className="p-3 rounded-xl"
              style={{ background: "var(--color-section-bg)", border: "1px solid var(--color-border)" }}>
              <div className="font-medium text-sm mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                {a.name}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
        <div>
          <span style={{ color: "#22C55E" }}>● </span>
          <strong style={{ color: "var(--color-text-primary)" }}>Free</strong>{" "}
          <span style={{ color: "var(--color-text-secondary)" }}>— Try the system</span>
        </div>
        <div>
          <span style={{ color: "#F59E0B" }}>● </span>
          <strong style={{ color: "var(--color-text-primary)" }}>Smart</strong>{" "}
          <span style={{ color: "var(--color-text-secondary)" }}>— Assist teachers</span>
        </div>
        <div>
          <span style={{ color: "#0A84FF" }}>● </span>
          <strong style={{ color: "var(--color-text-primary)" }}>Advanced</strong>{" "}
          <span style={{ color: "var(--color-text-secondary)" }}>— Full automation</span>
        </div>
      </div>
    </div>
  );
}
