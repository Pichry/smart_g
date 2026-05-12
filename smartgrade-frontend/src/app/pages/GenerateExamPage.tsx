import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import {
  Sparkles, FileText, Upload, AlertCircle, CheckCircle2,
  Loader2, Trash2, Save, ArrowLeft, BookOpen, User,
  Hash, FileKey, X,
} from "lucide-react";
import { usePlan } from "../lib/PlanContext";
import {
  ApiError, answerKeysApi, questionsApi,
  type GeneratedType, type GeneratedQuestion, type QuestionType,
} from "../lib/api";

interface ExamForm {
  name: string;
  subject: string;
  examCode: string;
  examTitle: string;
  teacherName: string;
  notes: string;
  customPrompt: string;
  count: number;
  types: GeneratedType[];
}

const emptyForm: ExamForm = {
  name: "",
  subject: "",
  examCode: "",
  examTitle: "",
  teacherName: "",
  notes: "",
  customPrompt: "",
  count: 5,
  types: ["mcq", "short", "true_false"],
};

// Editable question in the preview
interface EditableQuestion {
  type: QuestionType;
  marks: number;
  question_text: string;
  correct_answer: string;
  rubric: string;
  options: string[] | null;
}

export function GenerateExamPage() {
  const navigate = useNavigate();
  const { plan: planInfo } = usePlan();

  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [generated, setGenerated] = useState<EditableQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Notes file upload
  const [uploadingNotes, setUploadingNotes] = useState(false);

  const canGenerate = planInfo?.capabilities.can_generate_questions ?? false;

  const totalMarks = generated.reduce((sum, q) => sum + (q.marks || 0), 0);

  const updateForm = (patch: Partial<ExamForm>) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const toggleType = (t: GeneratedType) => {
    setForm((f) => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
    }));
  };

  // ─── File upload for notes ──────────────────────────────────────────────────
  const handleNotesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNotes(true);
    setError(null);
    try {
      const res = await questionsApi.uploadNotes(file);
      updateForm({ notes: res.text });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload notes");
    } finally {
      setUploadingNotes(false);
      e.target.value = "";
    }
  };

  // ─── Generate questions ─────────────────────────────────────────────────────
  const runGenerate = async () => {
    setError(null);
    if (form.notes.trim().length < 20) {
      setError("Please add at least 20 characters of notes");
      return;
    }
    if (form.types.length === 0) {
      setError("Select at least one question type");
      return;
    }

    setGenerating(true);
    try {
      const res = await questionsApi.generate({
        notes: form.notes.trim(),
        count: form.count,
        types: form.types,
        custom_prompt: form.customPrompt.trim() || undefined,
      });
      const editable: EditableQuestion[] = res.questions.map((q: GeneratedQuestion) => ({
        type: q.type as QuestionType,
        marks: q.marks,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        rubric: q.rubric || "",
        options: q.options,
      }));
      setGenerated(editable);
      // Auto-fill exam name from notes if empty
      if (!form.name.trim()) {
        const suggested = form.notes.trim().split(/\s+/).slice(0, 5).join(" ") + "...";
        updateForm({ name: suggested.length > 60 ? suggested.slice(0, 60) : suggested });
      }
      if (!form.subject.trim()) {
        // Try to extract first capitalized phrase as subject hint
        const match = form.notes.match(/\b([A-Z][a-z]+(?:\s+[a-z]+){0,2})\b/);
        if (match) updateForm({ subject: match[1] });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Edit question ──────────────────────────────────────────────────────────
  const updateQuestion = (idx: number, patch: Partial<EditableQuestion>) => {
    setGenerated((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (idx: number) => {
    setGenerated((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Save as answer key ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) { setError("Exam name is required"); return; }
    if (generated.length === 0) { setError("Generate at least one question first"); return; }

    for (let i = 0; i < generated.length; i++) {
      const q = generated[i];
      if (!q.correct_answer.trim()) { setError(`Question ${i + 1}: enter the correct answer`); return; }
      if (!q.marks || q.marks < 1) { setError(`Question ${i + 1}: marks must be at least 1`); return; }
      if (q.type === "mcq" && !["A","B","C","D","E"].includes(q.correct_answer.trim().toUpperCase())) {
        setError(`Question ${i + 1}: MCQ answer must be A–E`); return;
      }
      if (q.type === "true_false" && !["True","False"].includes(q.correct_answer.trim())) {
        setError(`Question ${i + 1}: True/False answer must be "True" or "False"`); return;
      }
    }

    setSaving(true);
    try {
      const questions = generated.map((q, i) => ({
        number: i + 1,
        type: q.type,
        marks: q.marks,
        correct_answer: q.type === "mcq" ? q.correct_answer.trim().toUpperCase() : q.correct_answer.trim(),
        rubric: q.rubric.trim() || null,
      }));

      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        total_marks: totalMarks,
        exam_code: form.examCode.trim() || undefined,
        exam_title: form.examTitle.trim() || undefined,
        teacher_name: form.teacherName.trim() || undefined,
        questions,
        source_notes: form.notes.trim() || null,
        generation_prompt: form.customPrompt.trim() || null,
      };

      await answerKeysApi.create(payload);
      setSuccess(`Exam "${form.name.trim()}" saved successfully! Redirecting to Answer Keys...`);
      setTimeout(() => navigate("/app/answer-keys"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setGenerated([]);
    setError(null);
    setSuccess(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/app/answer-keys")}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Generate Exam
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Create an exam from your lecture notes using AI
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-4" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{error}</span>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 mb-4" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "#22C55E" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{success}</span>
          </div>
        </Card>
      )}

      {!canGenerate && (
        <Card className="p-4 mb-4" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              AI question generation requires the Smart Grading or Advanced plan.
              <Button onClick={() => navigate("/app/subscription")} variant="ghost" size="sm" className="ml-2">
                Upgrade
              </Button>
            </span>
          </div>
        </Card>
      )}

      {/* ── Exam Details Section ──────────────────────────────────────────── */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <FileKey className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          Exam Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              Exam Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="e.g. Biology Midterm 2026"
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
              <Hash className="w-3.5 h-3.5 inline mr-1" />
              Exam Code
            </label>
            <input
              value={form.examCode}
              onChange={(e) => updateForm({ examCode: e.target.value })}
              placeholder="e.g. BIO101"
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
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              Subject
            </label>
            <input
              value={form.subject}
              onChange={(e) => updateForm({ subject: e.target.value })}
              placeholder="e.g. Biology"
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
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              Exam Title
            </label>
            <input
              value={form.examTitle}
              onChange={(e) => updateForm({ examTitle: e.target.value })}
              placeholder="e.g. Cell Biology & Photosynthesis"
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
              <User className="w-3.5 h-3.5 inline mr-1" />
              Teacher's Name
            </label>
            <input
              value={form.teacherName}
              onChange={(e) => updateForm({ teacherName: e.target.value })}
              placeholder="e.g. Mr. Habimana"
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

      {/* ── Notes Section ─────────────────────────────────────────────────── */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <FileText className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          Lecture Notes
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            Upload notes file (TXT, PDF, DOCX)
          </label>
          <div className="flex items-center gap-3">
            <label
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <Upload className="w-4 h-4" />
              {uploadingNotes ? "Uploading..." : "Choose file"}
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleNotesUpload}
                className="hidden"
                disabled={uploadingNotes}
              />
            </label>
            {uploadingNotes && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--color-primary)" }} />}
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-tertiary)" }}>
            Supported: .txt, .pdf, .docx (max 10MB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
            Or paste notes below
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => updateForm({ notes: e.target.value })}
            placeholder="Paste your lecture notes or textbook excerpt here. The AI will read them and generate exam questions..."
            rows={8}
            className="w-full px-3 py-2 rounded-xl text-sm resize-y"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {form.notes.length} characters · 20 minimum
            </span>
          </div>
        </div>
      </Card>

      {/* ── AI Instructions Section ────────────────────────────────────────── */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <Sparkles className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          AI Instructions <span className="text-sm font-normal" style={{ color: "var(--color-text-tertiary)" }}>(optional)</span>
        </h2>
        <textarea
          value={form.customPrompt}
          onChange={(e) => updateForm({ customPrompt: e.target.value })}
          placeholder="Tell the AI what kind of questions to generate. E.g. 'Make 3 easy multiple choice questions, 2 true/false about cell structure, and 1 essay question about photosynthesis. Focus on key definitions.'"
          rows={3}
          className="w-full px-3 py-2 rounded-xl text-sm resize-y"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
        <p className="text-xs mt-1.5" style={{ color: "var(--color-text-tertiary)" }}>
          Give the AI specific instructions about difficulty, topics, or question style.
        </p>
      </Card>

      {/* ── Settings Section ──────────────────────────────────────────────── */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
          Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              Number of questions
            </label>
            <input
              type="number" min={1} max={20}
              value={form.count}
              onChange={(e) => updateForm({ count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
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
              Question types
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(["mcq", "true_false", "short", "long"] as const).map((t) => {
                const active = form.types.includes(t);
                const labels: Record<string, string> = {
                  mcq: "MCQ",
                  true_false: "T/F",
                  short: "Short",
                  long: "Long",
                };
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? "var(--color-primary)" : "var(--color-bg)",
                      color: active ? "#fff" : "var(--color-text-primary)",
                      border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Generate Button ──────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={runGenerate}
          loading={generating}
          disabled={!canGenerate || generating}
          size="lg"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate {form.count} {form.count === 1 ? "question" : "questions"}</>
          )}
        </Button>
        <Button onClick={reset} variant="ghost" disabled={generating || saving}>
          Reset
        </Button>
      </div>

      {/* ── Generated Questions Preview ────────────────────────────────────── */}
      {generated.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
              Generated Questions
              <span className="text-sm font-normal" style={{ color: "var(--color-text-secondary)" }}>
                · {generated.length} questions · {totalMarks} total marks
              </span>
            </h2>
            <Badge variant="info">
              <Sparkles className="w-3 h-3" /> AI Generated
            </Badge>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {generated.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl"
                style={{
                  background: "var(--color-section-bg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{
                      background: "var(--color-bg)",
                      color: "var(--color-text-primary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    Q{idx + 1}
                  </span>

                  {/* Type selector */}
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, { type: e.target.value as QuestionType })}
                    className="px-2 py-1 rounded-lg text-sm"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True/False</option>
                    <option value="short">Short Answer</option>
                    <option value="long">Long Answer</option>
                  </select>

                  {/* Marks input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(idx, { marks: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-16 px-2 py-1 rounded-lg text-sm text-center"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>marks</span>
                  </div>

                  <button
                    onClick={() => removeQuestion(idx)}
                    className="ml-auto p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question text */}
                <textarea
                  value={q.question_text}
                  onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2 resize-y"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />

                {/* MCQ options */}
                {q.type === "mcq" && (
                  <div className="mb-2">
                    <div className="flex gap-1.5">
                      {(["A", "B", "C", "D", "E"] as const).map((letter) => (
                        <button
                          key={letter}
                          onClick={() => updateQuestion(idx, { correct_answer: letter })}
                          className="w-8 h-8 rounded-lg font-medium text-xs transition-all"
                          style={{
                            background: q.correct_answer === letter
                              ? "var(--color-primary)" : "var(--color-bg)",
                            color: q.correct_answer === letter
                              ? "#fff" : "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* True/False */}
                {q.type === "true_false" && (
                  <div className="flex gap-2 mb-2">
                    {(["True", "False"] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => updateQuestion(idx, { correct_answer: val })}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: q.correct_answer === val
                            ? "var(--color-primary)" : "var(--color-bg)",
                          color: q.correct_answer === val
                            ? "#fff" : "var(--color-text-primary)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {/* Correct answer (for short/long) */}
                {(q.type === "short" || q.type === "long") && (
                  <div className="space-y-2 mb-2">
                    <textarea
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(idx, { correct_answer: e.target.value })}
                      placeholder="Model answer"
                      rows={q.type === "long" ? 3 : 2}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                )}

                {/* Rubric (for all except MCQ) */}
                {(q.type !== "mcq" && q.type !== "true_false") && (
                  <textarea
                    value={q.rubric}
                    onChange={(e) => updateQuestion(idx, { rubric: e.target.value })}
                    placeholder="Rubric (grading guidance)"
                    rows={1}
                    className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2 mt-6 pt-4"
            style={{ borderTop: "1px solid var(--color-border)" }}>
            <Button onClick={() => setGenerated([])} variant="ghost" disabled={saving}>
              Discard
            </Button>
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="w-4 h-4" /> Save Exam as Answer Key
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}