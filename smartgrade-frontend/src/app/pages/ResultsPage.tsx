import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import {
  FileText, Clock, Trash2, Loader2, AlertCircle, CheckCircle2, Scan as ScanIcon,
} from "lucide-react";
import {
  ApiError, scansApi,
  type Scan, type ScanDetail,
} from "../lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<ScanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const focusedId = searchParams.get("scan");

  useEffect(() => {
    scansApi.list()
      .then(setScans)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load scans"))
      .finally(() => setLoading(false));
  }, []);

  // If we arrived with ?scan=ID, open that scan's detail.
  useEffect(() => {
    if (!focusedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    scansApi.get(Number(focusedId))
      .then(setDetail)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load scan"))
      .finally(() => setDetailLoading(false));
  }, [focusedId]);

  const closeDetail = () => {
    setDetail(null);
    searchParams.delete("scan");
    setSearchParams(searchParams);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this scan?")) return;
    try {
      await scansApi.remove(id);
      setScans((s) => s.filter((x) => x.id !== id));
      if (Number(focusedId) === id) closeDetail();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const statusBadge = (s: Scan) => {
    const map = {
      pending:    { variant: "warning" as const, label: "Queued" },
      processing: { variant: "info"    as const, label: "Grading" },
      completed:  { variant: "success" as const, label: "Done" },
      failed:     { variant: "error"   as const, label: "Failed" },
    };
    return <Badge variant={map[s.status].variant}>{map[s.status].label}</Badge>;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Results
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            All your graded papers, newest first.
          </p>
        </div>
        <Button onClick={() => navigate("/app/scan")}>
          <ScanIcon className="w-4 h-4" /> Scan a paper
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-4" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{error}</span>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} /></Card>
      ) : scans.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>No results yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Scan your first paper to see results here.
          </p>
          <Button onClick={() => navigate("/app/scan")}>
            <ScanIcon className="w-4 h-4" /> Scan a paper
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--color-section-bg)" }}>
                <tr>
                  {["Student", "Exam", "Score", "Status", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                    onClick={() => setSearchParams({ scan: String(s.id) })}
                  >
                    <td className="px-5 py-3" style={{ color: "var(--color-text-primary)" }}>
                      {s.student_name || <span style={{ color: "var(--color-text-tertiary)" }}>Scan #{s.id}</span>}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {s.exam_label || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {s.status === "completed" ? (
                        <span style={{ color: "var(--color-text-primary)" }}>
                          <strong>{s.score}/{s.total_marks}</strong>
                          <span className="ml-1.5" style={{ color: "var(--color-text-secondary)" }}>
                            ({s.percentage?.toFixed(0)}%)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{statusBadge(s)}</td>
                    <td className="px-5 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(s.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}
                        title="Delete scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Detail modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!focusedId}
        onClose={closeDetail}
        title={detail ? (detail.student_name || `Scan #${detail.id}`) : "Loading..."}
        size="lg"
      >
        {detailLoading || !detail ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 pb-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}>
              {detail.status === "completed" ? (
                <>
                  <div className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                    {detail.score}/{detail.total_marks}
                  </div>
                  <div className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                    {detail.percentage?.toFixed(1)}%
                  </div>
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" /> Graded
                  </Badge>
                </>
              ) : detail.status === "failed" ? (
                <>
                  <Badge variant="error">
                    <AlertCircle className="w-3 h-3" /> Failed
                  </Badge>
                  {detail.error_message && (
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {detail.error_message}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="warning">{detail.status}</Badge>
              )}
              <div className="ml-auto text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {formatDate(detail.created_at)}
              </div>
            </div>

            {/* Per-question results */}
            {detail.results.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-secondary)" }}>
                No question results yet.
              </p>
            ) : (
              <div className="space-y-3">
                {detail.results.map((r) => {
                  const correct = r.question_type === "mcq" && r.marks_awarded >= r.marks_possible;
                  return (
                    <div
                      key={r.question_number}
                      className="p-4 rounded-xl"
                      style={{
                        background: "var(--color-section-bg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            Q{r.question_number}
                          </span>
                          <Badge variant="neutral">{r.question_type}</Badge>
                        </div>
                        <div className="text-right">
                          <span
                            className="font-semibold"
                            style={{
                              color: r.marks_awarded === r.marks_possible
                                ? "#22C55E"
                                : r.marks_awarded > 0 ? "#F59E0B" : "#EF4444",
                            }}
                          >
                            {r.marks_awarded}/{r.marks_possible}
                          </span>
                        </div>
                      </div>

                      {r.question_type === "mcq" ? (
                        <div className="text-sm flex items-center gap-3" style={{ color: "var(--color-text-secondary)" }}>
                          <span>Student: <strong style={{ color: "var(--color-text-primary)" }}>{r.student_answer || "—"}</strong></span>
                          <span>Correct: <strong style={{ color: "var(--color-text-primary)" }}>{r.correct_answer}</strong></span>
                          {correct
                            ? <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: "#22C55E" }} />
                            : <AlertCircle className="w-4 h-4 ml-auto" style={{ color: "#EF4444" }} />}
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          {r.student_answer && (
                            <div>
                              <div className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>Student answer</div>
                              <div style={{ color: "var(--color-text-primary)" }}>{r.student_answer}</div>
                            </div>
                          )}
                          {r.feedback && (
                            <div>
                              <div className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>Feedback</div>
                              <div style={{ color: "var(--color-text-secondary)" }}>{r.feedback}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
