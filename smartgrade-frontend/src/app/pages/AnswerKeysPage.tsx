import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import {
  Plus, Edit2, Trash2, CheckCircle2, FileKey, BookOpen, AlertCircle, X, Sparkles, Loader2, Lock,
} from "lucide-react";
import {
  answerKeysApi, ApiError, questionsApi,
  type AnswerKey, type Question, type QuestionType, type GeneratedType,
} from "../lib/api";
import { usePlan } from "../lib/PlanContext";

// Form-side question type with `marks` as string for input control.
interface QFormState {
  type: QuestionType;
  marks: string;
  correct_answer: string;
  rubric: string;
}

const newMcq    = (): QFormState => ({ type: "mcq",   marks: "1", correct_answer: "A",  rubric: "" });
const newShort  = (): QFormState => ({ type: "short", marks: "5", correct_answer: "",   rubric: "" });
const newLong   = (): QFormState => ({ type: "long",  marks: "10", correct_answer: "",  rubric: "" });

interface FormState {
  name: string;
  subject: string;
  sourceNotes: string;
  questions: QFormState[];
}

const emptyForm: FormState = { name: "", subject: "", sourceNotes: "", questions: [newMcq()] };

export function AnswerKeysPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<AnswerKey[]>([]);
  const { plan: planInfo } = usePlan();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editKey, setEditKey] = useState<AnswerKey | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    answerKeysApi.list()
      .then(setKeys)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load keys"))
      .finally(() => setLoading(false));
  }, []);

  const canGenerate = planInfo?.capabilities.can_generate_questions ?? false;

  const totalMarks = form.questions.reduce(
    (sum, q) => sum + (parseInt(q.marks, 10) || 0), 0
  );

  const openCreate = () => {
    setEditKey(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (key: AnswerKey) => {
    setEditKey(key);
    // Convert from API shape (legacy or rich) to form shape.
    const questions: QFormState[] = key.questions
      ? key.questions.map((q) => ({
          type: q.type, marks: String(q.marks),
          correct_answer: q.correct_answer, rubric: q.rubric || "",
        }))
      : (key.answers || []).map((ans) => ({
          type: "mcq" as QuestionType, marks: "1",
          correct_answer: ans, rubric: "",
        }));
    setForm({
      name: key.name, subject: key.subject,
      sourceNotes: key.source_notes || "",
      questions: questions.length ? questions : [newMcq()],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const updateQuestion = (i: number, patch: Partial<QFormState>) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q),
    }));
  };

  const removeQuestion = (i: number) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.length > 1
        ? f.questions.filter((_, idx) => idx !== i)
        : f.questions,
    }));
  };

  const addQuestion = (type: QuestionType) => {
    setForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        type === "mcq" ? newMcq() : type === "short" ? newShort() : newLong(),
      ],
    }));
  };

  // ─── AI question generation ─────────────────────────────────────────────────
  const [genOpen, setGenOpen] = useState(false);
  const [genNotes, setGenNotes] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [genTypes, setGenTypes] = useState<GeneratedType[]>(["mcq", "short"]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const toggleGenType = (t: GeneratedType) => {
    setGenTypes((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  };

  const runGenerate = async () => {
    if (genNotes.trim().length < 20) {
      setGenError("Paste at least 20 characters of notes");
      return;
    }
    if (genTypes.length === 0) {
      setGenError("Pick at least one question type");
      return;
    }
    setGenError(null);
    setGenerating(true);
    try {
      const res = await questionsApi.generate({
        notes: genNotes.trim(), count: genCount, types: genTypes,
      });
      // Append generated questions to the form, and also save the notes
      // on the form so they get persisted with the key for grading context.
      const newOnes: QFormState[] = res.questions.map((q) => ({
        type: q.type as QuestionType,
        marks: String(q.marks),
        correct_answer: q.correct_answer,
        rubric: q.rubric || (q.options ? `Options:\n${q.options.join("\n")}` : ""),
      }));
      setForm((f) => ({
        ...f,
        sourceNotes: f.sourceNotes || genNotes.trim(),
        questions: [...f.questions, ...newOnes],
      }));
      setGenOpen(false);
      setGenNotes("");
    } catch (e) {
      setGenError(e instanceof ApiError ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Please give the answer key a name";
    if (form.questions.length === 0) return "Add at least one question";
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.correct_answer.trim()) return `Question ${i + 1}: enter the correct answer`;
      const m = parseInt(q.marks, 10);
      if (!m || m < 1) return `Question ${i + 1}: marks must be at least 1`;
      if (q.type === "mcq" && !["A","B","C","D","E"].includes(q.correct_answer.trim().toUpperCase())) {
        return `Question ${i + 1}: MCQ answer must be A–E`;
      }
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }

    setSaving(true);
    setFormError(null);
    try {
      const questions: Question[] = form.questions.map((q, i) => ({
        number: i + 1,
        type: q.type,
        marks: parseInt(q.marks, 10),
        correct_answer:
          q.type === "mcq" ? q.correct_answer.trim().toUpperCase() : q.correct_answer.trim(),
        rubric: q.rubric.trim() || null,
      }));
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        total_marks: totalMarks,
        questions,
        source_notes: form.sourceNotes.trim() || null,
      };

      const saved = editKey
        ? await answerKeysApi.update(editKey.id, payload)
        : await answerKeysApi.create(payload);

      setKeys((curr) => editKey
        ? curr.map((k) => k.id === saved.id ? saved : k)
        : [saved, ...curr]
      );
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id: number) => {
    try {
      const updated = await answerKeysApi.activate(id);
      setKeys((curr) => curr.map((k) => ({ ...k, is_active: k.id === updated.id })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Activation failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this answer key? This cannot be undone.")) return;
    try {
      await answerKeysApi.remove(id);
      setKeys((curr) => curr.filter((k) => k.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const questionCount = (k: AnswerKey) =>
    k.questions ? k.questions.length : (k.answers?.length || 0);

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Answer keys
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Define the correct answers for each paper you grade.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Create new key
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

      {loading && (
        <Card className="p-8 text-center"><span style={{ color: "var(--color-text-secondary)" }}>Loading…</span></Card>
      )}

      {!loading && keys.length === 0 && (
        <Card className="p-12 text-center">
          <FileKey className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            No answer keys yet
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Create your first answer key to start grading.
          </p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create new key
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {keys.map((k) => (
          <Card key={k.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {k.name}
                  </h3>
                  {k.is_active && (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </Badge>
                  )}
                  {k.source_notes && (
                    <Badge variant="info">
                      <Sparkles className="w-3 h-3" /> Notes-based
                    </Badge>
                  )}
                </div>
                {k.subject && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <BookOpen className="w-3.5 h-3.5" /> {k.subject}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm mb-4 flex items-center gap-3"
              style={{ color: "var(--color-text-secondary)" }}>
              <span>{questionCount(k)} questions</span>
              <span>·</span>
              <span>{k.total_marks} marks</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {!k.is_active && (
                <Button onClick={() => activate(k.id)} size="sm" variant="secondary">
                  Set active
                </Button>
              )}
              <Button onClick={() => openEdit(k)} size="sm" variant="outline">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button onClick={() => remove(k.id)} size="sm" variant="ghost">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Create / edit modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editKey ? "Edit answer key" : "Create answer key"}
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Math Midterm 2026"
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
                Subject <span style={{ color: "var(--color-text-tertiary)" }}>(optional)</span>
              </label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
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
              Source notes <span style={{ color: "var(--color-text-tertiary)" }}>(optional, used to verify answers during grading)</span>
            </label>
            <textarea
              value={form.sourceNotes}
              onChange={(e) => setForm({ ...form, sourceNotes: e.target.value })}
              placeholder="Paste the lecture notes / textbook excerpt this exam covers. The AI will cross-check student answers against this material."
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm resize-y"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            {form.sourceNotes.trim() && (
              <p className="text-xs mt-1.5 inline-flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                <Sparkles className="w-3 h-3" />
                {form.sourceNotes.length} characters · written-answer grading will reference these notes
              </p>
            )}
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Questions <span style={{ color: "var(--color-text-secondary)" }}>· total {totalMarks} marks</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {canGenerate ? (
                  <Button onClick={() => navigate("/app/generate-exam")} size="sm" variant="primary">
                    <Sparkles className="w-3.5 h-3.5" /> Generate from notes
                  </Button>
                ) : (
                  <Button
                    onClick={() => setFormError("AI question generation requires Smart Grading or Advanced plan. Upgrade in the Subscription page.")}
                    size="sm"
                    variant="outline"
                    title="Upgrade to use AI generation"
                  >
                    <Lock className="w-3.5 h-3.5" /> Generate (locked)
                  </Button>
                )}
                <Button onClick={() => addQuestion("mcq")}   size="sm" variant="outline">+ MCQ</Button>
                <Button onClick={() => addQuestion("short")} size="sm" variant="outline">+ Short</Button>
                <Button onClick={() => addQuestion("long")}  size="sm" variant="outline">+ Long</Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {form.questions.map((q, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: "var(--color-section-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                      style={{
                        background: "var(--color-bg)",
                        color: "var(--color-text-primary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      Q{i + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(i, { type: e.target.value as QuestionType })}
                      className="px-2 py-1 rounded-lg text-sm"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <option value="mcq">MCQ</option>
                      <option value="short">Short answer</option>
                      <option value="long">Long answer</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(i, { marks: e.target.value })}
                      placeholder="Marks"
                      className="w-20 px-2 py-1 rounded-lg text-sm"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <span className="text-sm self-center" style={{ color: "var(--color-text-secondary)" }}>marks</span>
                    <button
                      onClick={() => removeQuestion(i)}
                      className="ml-auto p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--color-text-secondary)" }}
                      title="Remove question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {q.type === "mcq" ? (
                    <div className="flex gap-1.5 mt-2">
                      {(["A", "B", "C", "D", "E"] as const).map((letter) => (
                        <button
                          key={letter}
                          onClick={() => updateQuestion(i, { correct_answer: letter })}
                          className="w-9 h-9 rounded-lg font-medium text-sm transition-all"
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
                  ) : (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={q.correct_answer}
                        onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })}
                        placeholder="Model answer (what a perfect response looks like)"
                        rows={q.type === "long" ? 4 : 2}
                        className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                        style={{
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <textarea
                        value={q.rubric}
                        onChange={(e) => updateQuestion(i, { rubric: e.target.value })}
                        placeholder="Rubric (optional grading guidance, e.g. '2 marks for definition, 3 for example')"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                        style={{
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-4 h-4" /> {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2"
            style={{ borderTop: "1px solid var(--color-border)" }}>
            <Button onClick={() => setModalOpen(false)} variant="ghost">Cancel</Button>
            <Button onClick={submit} loading={saving}>
              {editKey ? "Save changes" : "Create key"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── AI generator modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={genOpen}
        onClose={() => { setGenOpen(false); setGenError(null); }}
        title="Generate questions from notes"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(108,92,231,0.06)",
              border: "1px solid rgba(108,92,231,0.2)",
            }}>
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>
              Paste your lecture notes or textbook excerpt. Claude will read them and write
              exam questions with model answers and rubrics. Edit anything before saving.
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              Notes
            </label>
            <textarea
              value={genNotes}
              onChange={(e) => setGenNotes(e.target.value)}
              placeholder="Paste 1–3 paragraphs from your notes..."
              rows={8}
              className="w-full px-3 py-2 rounded-xl text-sm resize-y"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            <div className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              {genNotes.length} characters · 20 minimum
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                How many questions?
              </label>
              <input
                type="number" min={1} max={20}
                value={genCount}
                onChange={(e) => setGenCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
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
                {(["mcq", "short", "long"] as const).map((t) => {
                  const active = genTypes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleGenType(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: active ? "var(--color-primary)" : "var(--color-bg)",
                        color: active ? "#fff" : "var(--color-text-primary)",
                        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {genError && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#EF4444" }}>
              <AlertCircle className="w-4 h-4" /> {genError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2"
            style={{ borderTop: "1px solid var(--color-border)" }}>
            <Button onClick={() => setGenOpen(false)} variant="ghost" disabled={generating}>
              Cancel
            </Button>
            <Button onClick={runGenerate} loading={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate {genCount} {genCount === 1 ? "question" : "questions"}</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
