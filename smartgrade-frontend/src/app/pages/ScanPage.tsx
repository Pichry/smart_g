import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { CameraCapture } from "../components/CameraCapture";
import {
  AlertCircle, CheckCircle2, Loader2, Scan as ScanIcon, Sparkles, Lock,
} from "lucide-react";
import {
  ApiError, answerKeysApi, scansApi,
  type AnswerKey, type ScanStatus,
} from "../lib/api";
import { usePlan } from "../lib/PlanContext";

type FlowState = "idle" | "uploading" | "grading" | "done" | "error";

export function ScanPage() {
  const navigate = useNavigate();

  const [keys, setKeys] = useState<AnswerKey[] | null>(null);
  const [activeKeyId, setActiveKeyId] = useState<number | "">("");
  const { plan: planInfo, refresh: refreshPlan } = usePlan();
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId]     = useState("");
  const [examLabel, setExamLabel]     = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [flow, setFlow] = useState<FlowState>("idle");
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<number | null>(null);

  // Load answer keys; plan info comes from the global PlanContext.
  useEffect(() => {
    answerKeysApi.list()
      .then((list) => {
        setKeys(list);
        const active = list.find((k) => k.is_active) || list[0];
        if (active) setActiveKeyId(active.id);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load page"));
  }, []);

  // Polling for grading status.
  useEffect(() => {
    if (flow !== "grading" || scanId == null) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const detail = await scansApi.get(scanId);
        if (cancelled) return;
        setStatus(detail.status);
        if (detail.status === "completed") {
          setFlow("done");
          setTimeout(() => navigate(`/app/results?scan=${scanId}`), 700);
        } else if (detail.status === "failed") {
          setFlow("error");
          setError(detail.error_message || "Grading failed");
        }
      } catch (e) {
        if (!cancelled) {
          setFlow("error");
          setError(e instanceof ApiError ? e.message : "Polling failed");
        }
      }
    };

    tick();
    const id = setInterval(tick, 1500);
    return () => { cancelled = true; clearInterval(id); };
  }, [flow, scanId, navigate]);

  const submit = async () => {
    setError(null);
    if (!activeKeyId)            { setError("Please select an answer key"); return; }
    if (!studentName.trim())     { setError("Student name is required"); return; }
    if (!studentId.trim())       { setError("Student ID is required"); return; }
    if (files.length === 0)      { setError("Please add at least one page"); return; }

    setFlow("uploading");
    try {
      const res = await scansApi.create({
        answer_key_id: Number(activeKeyId),
        images: files,
        student_name: studentName.trim(),
        student_id:   studentId.trim(),
        exam_label:   examLabel.trim() || undefined,
      });
      setScanId(res.id);
      setStatus(res.status);
      setFlow("grading");
      // Refresh plan info globally so the sidebar counter updates.
      refreshPlan();
    } catch (e) {
      setFlow("error");
      const message = e instanceof ApiError ? e.message : "Upload failed";
      setError(message);
    }
  };

  const reset = () => {
    setFiles([]); setScanId(null); setStatus(null); setError(null); setFlow("idle");
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────
  if (keys === null) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-slide-up">
        <Card className="p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Create an answer key first
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            You need at least one answer key before you can grade a paper.
          </p>
          <Button onClick={() => navigate("/app/answer-keys")}>Go to Answer Keys</Button>
        </Card>
      </div>
    );
  }

  // Free-plan exhausted? Show a friendly upgrade prompt instead of the scan form.
  const exhausted = planInfo && !planInfo.can_scan;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Scan a paper
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Upload or photograph an exam paper to grade it automatically.
        </p>
      </div>

      {/* Plan banner */}
      {planInfo && (
        <Card className="p-3 mb-6" style={{
          background: planInfo.plan === "free"
            ? "rgba(245,158,11,0.06)"
            : "rgba(34,197,94,0.06)",
          border: planInfo.plan === "free"
            ? "1px solid rgba(245,158,11,0.2)"
            : "1px solid rgba(34,197,94,0.2)",
        }}>
          <div className="flex items-center gap-2 text-sm">
            {planInfo.plan === "free" ? (
              <>
                <Lock className="w-4 h-4" style={{ color: "#F59E0B" }} />
                <span style={{ color: "var(--color-text-primary)" }}>
                  <strong>Free Trial:</strong> {planInfo.free_scans_remaining} of {planInfo.free_scans_limit} attempts remaining
                </span>
                <Button onClick={() => navigate("/app/subscription")} variant="ghost" size="sm" className="ml-auto">
                  Upgrade
                </Button>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" style={{ color: "#22C55E" }} />
                <span style={{ color: "var(--color-text-primary)" }}>
                  <strong>{planInfo.plan === "smart" ? "Smart Grading" : "Advanced AI Exam Suite"}</strong>
                  <span style={{ color: "var(--color-text-secondary)" }}> — unlimited scans</span>
                </span>
              </>
            )}
          </div>
        </Card>
      )}

      {exhausted && (
        <Card className="p-8 text-center">
          <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: "#F59E0B" }} />
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            You've used all 3 free scans
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Upgrade to keep grading papers — pay later via mobile money.
          </p>
          <Button onClick={() => navigate("/app/subscription")}>See plans</Button>
        </Card>
      )}

      {!exhausted && (
        <>
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                  Answer key
                </label>
                <select
                  value={activeKeyId}
                  onChange={(e) => setActiveKeyId(Number(e.target.value))}
                  disabled={flow !== "idle"}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {keys.map((k) => {
                    const hasWritten = k.questions?.some((q) => q.type !== "mcq" && q.type !== "true_false") ?? false;
                    const locked = hasWritten && !planInfo?.capabilities.can_grade_written;
                    return (
                      <option key={k.id} value={k.id} disabled={locked}>
                        {k.name} {k.subject ? `· ${k.subject}` : ""} ({k.total_marks} marks)
                        {k.is_active ? " — active" : ""}
                        {locked ? " — 🔒 upgrade required" : ""}
                      </option>
                    );
                  })}
                </select>
                {planInfo && !planInfo.capabilities.can_grade_written && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                    Free Trial supports MCQ-only keys. Keys with written questions show 🔒 — upgrade to use them.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                    Student name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    disabled={flow !== "idle"}
                    required
                    placeholder="e.g. Ishimwe Jean"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                    Student ID <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={flow !== "idle"}
                    required
                    placeholder="e.g. 46784"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                  Exam label <span style={{ color: "var(--color-text-tertiary)" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={examLabel}
                  onChange={(e) => setExamLabel(e.target.value)}
                  disabled={flow !== "idle"}
                  placeholder="e.g. Math Midterm — Term 2"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <CameraCapture
              onChange={setFiles}
              disabled={flow !== "idle"}
              maxPages={planInfo?.capabilities.max_pages_per_scan ?? 1}
            />
          </Card>

          {flow !== "idle" && (
            <Card className="p-5 mb-6">
              <div className="flex items-start gap-3">
                {(flow === "uploading" || flow === "grading") && (
                  <Loader2 className="w-5 h-5 animate-spin mt-0.5" style={{ color: "var(--color-primary)" }} />
                )}
                {flow === "done"  && <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: "#22C55E" }} />}
                {flow === "error" && <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "#EF4444" }} />}
                <div className="flex-1">
                  <div className="font-medium mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                    {flow === "uploading" && "Uploading pages..."}
                    {flow === "grading"   && (status === "processing" ? "Grading paper..." : "Queued for grading...")}
                    {flow === "done"      && "Done! Opening results..."}
                    {flow === "error"     && "Something went wrong"}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {flow === "grading" && (
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Running OCR + AI grading
                      </span>
                    )}
                    {flow === "error" && error}
                  </div>
                </div>
                {(flow === "error" || flow === "done") && (
                  <Button onClick={reset} variant="ghost" size="sm">Reset</Button>
                )}
              </div>
            </Card>
          )}

          {flow === "idle" && (
            <div className="flex items-center justify-between gap-3">
              {error && (
                <Badge variant="error">
                  <AlertCircle className="w-3 h-3" /> {error}
                </Badge>
              )}
              <div className="ml-auto">
                <Button
                  onClick={submit}
                  size="lg"
                  disabled={
                    files.length === 0 ||
                    !activeKeyId ||
                    !studentName.trim() ||
                    !studentId.trim()
                  }
                >
                  <ScanIcon className="w-4 h-4" /> Grade this paper
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
