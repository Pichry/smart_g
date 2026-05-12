import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import {
  FileText, TrendingUp, Zap, Scan, ArrowRight, Clock,
  ChevronRight, BarChart2, BookOpen, Loader2, AlertCircle,
} from "lucide-react";
import {
  ApiError, analyticsApi, scansApi,
  type DashboardStats, type Scan as ScanT,
} from "../lib/api";

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<ScanT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([analyticsApi.dashboard(), scansApi.list()])
      .then(([s, scans]) => {
        setStats(s);
        setRecent(scans.slice(0, 6));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Papers scanned",
      value: stats ? String(stats.papers_scanned) : "—",
      change: stats?.scans_this_week ? `+${stats.scans_this_week} this week` : "No scans this week",
      icon: FileText,
      bg: "rgba(108,92,231,0.06)", border: "rgba(108,92,231,0.15)",
      iconBg: "var(--color-primary)", valColor: "var(--color-primary)",
    },
    {
      label: "Average score",
      value: stats?.average_score_pct != null ? `${stats.average_score_pct.toFixed(0)}%` : "—",
      change: stats?.papers_scanned ? "Across all completed scans" : "Grade your first paper",
      icon: TrendingUp,
      bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)",
      iconBg: "#22C55E", valColor: "#16a34a",
    },
    {
      label: "Last activity",
      value: stats?.last_scan_at ? formatRelative(stats.last_scan_at) : "—",
      change: stats?.last_scan_at ? new Date(stats.last_scan_at).toLocaleDateString() : "Never",
      icon: Zap,
      bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)",
      iconBg: "#F59E0B", valColor: "#d97706",
    },
  ];

  const quickActions = [
    { label: "Scan new paper",     icon: Scan,      path: "/app/scan",         primary: true  },
    { label: "View analytics",     icon: BarChart2, path: "/app/analytics",    primary: false },
    { label: "Manage answer keys", icon: BookOpen,  path: "/app/answer-keys",  primary: false },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Quick overview of your grading activity.
          </p>
        </div>
        <Button onClick={() => navigate("/app/scan")} size="lg">
          <Scan className="w-4 h-4" /> Scan a paper
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{error}</span>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: c.iconBg }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>{c.label}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: c.valColor }}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin inline" /> : c.value}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{c.change}</div>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Card
              key={a.label}
              hover
              onClick={() => navigate(a.path)}
              className="p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg"
                style={{
                  background: a.primary ? "var(--color-primary)" : "rgba(108,92,231,0.08)",
                  color: a.primary ? "#fff" : "var(--color-primary)",
                }}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                {a.label}
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Recent activity
        </h2>
        {recent.length > 0 && (
          <Button onClick={() => navigate("/app/results")} variant="ghost" size="sm">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} /></Card>
      ) : recent.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            No scans yet
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Grade your first paper to see it here.
          </p>
          <Button onClick={() => navigate("/app/scan")}>
            <Scan className="w-4 h-4" /> Scan a paper
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {recent.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                onClick={() => navigate(`/app/results?scan=${s.id}`)}
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {s.student_name || `Scan #${s.id}`}
                  </div>
                  <div className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
                    {s.exam_label && <span>{s.exam_label}</span>}
                    <Clock className="w-3 h-3" />
                    {formatRelative(s.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  {s.status === "completed" ? (
                    <>
                      <div className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {s.score}/{s.total_marks}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {s.percentage?.toFixed(0)}%
                      </div>
                    </>
                  ) : (
                    <Badge variant={s.status === "failed" ? "error" : "warning"}>
                      {s.status}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
