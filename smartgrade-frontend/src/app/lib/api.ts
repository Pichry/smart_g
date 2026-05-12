/**
 * API client. Talks to the FastAPI backend.
 *
 * - Base URL is read from VITE_API_URL, falls back to localhost:8000.
 * - Auth token is read from localStorage on every call (so it picks up
 *   logins/logouts without needing to re-instantiate anything).
 * - Throws ApiError with { status, message } on non-2xx responses.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "smartgrade_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  // Only set JSON content-type when we're sending a string body.
  // Don't set it for FormData uploads — the browser sets multipart boundary.
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (res.status === 204) return undefined as T;

  let body: any = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const message =
      (body && (body.detail || body.message)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message));
  }

  return body as T;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch:  <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  signup: (data: { full_name: string; email: string; password: string }) =>
    api.post<AuthResponse>("/api/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/api/auth/login", data),
  me: () => api.get<User>("/api/auth/me"),
};

// ── Answer keys ───────────────────────────────────────────────────────────────
export type QuestionType = "mcq" | "short" | "long" | "true_false";

export interface Question {
  number: number;
  type: QuestionType;
  marks: number;
  correct_answer: string;
  rubric?: string | null;
}

export interface AnswerKey {
  id: number;
  name: string;
  subject: string;
  total_marks: number;
  // Exam metadata
  exam_code?: string | null;
  exam_title?: string | null;
  teacher_name?: string | null;
  // The backend keeps both shapes for backward compat. New keys use `questions`.
  answers?: string[] | null;
  questions?: Question[] | null;
  source_notes?: string | null;
  generation_prompt?: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: number;
}

export interface AnswerKeyInput {
  name: string;
  subject: string;
  total_marks: number;
  exam_code?: string;
  exam_title?: string;
  teacher_name?: string;
  answers?: string[];
  questions?: Question[];
  source_notes?: string | null;
  generation_prompt?: string | null;
}

export const answerKeysApi = {
  list:     ()                                  => api.get<AnswerKey[]>("/api/answer-keys"),
  create:   (data: AnswerKeyInput)              => api.post<AnswerKey>("/api/answer-keys", data),
  update:   (id: number, data: Partial<AnswerKeyInput>) =>
                                                   api.patch<AnswerKey>(`/api/answer-keys/${id}`, data),
  remove:   (id: number)                        => api.delete<void>(`/api/answer-keys/${id}`),
  activate: (id: number)                        => api.post<AnswerKey>(`/api/answer-keys/${id}/activate`),
};

// ── Scans ─────────────────────────────────────────────────────────────────────
export type ScanStatus = "pending" | "processing" | "completed" | "failed";

export interface QuestionResult {
  question_number: number;
  question_type: string;
  marks_possible: number;
  marks_awarded: number;
  correct_answer: string | null;
  student_answer: string | null;
  feedback: string | null;
}

export interface Scan {
  id: number;
  student_name: string | null;
  student_id: string | null;
  exam_label: string | null;
  status: ScanStatus;
  error_message: string | null;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  created_at: string;
  completed_at: string | null;
  answer_key_id: number;
}

export interface ScanDetail extends Scan {
  results: QuestionResult[];
}

export interface ScanCreateInput {
  answer_key_id: number;
  images: (File | Blob)[];
  student_name: string;
  student_id: string;
  exam_label?: string;
}

export const scansApi = {
  list: () => api.get<Scan[]>("/api/scans"),
  get: (id: number) => api.get<ScanDetail>(`/api/scans/${id}`),
  remove: (id: number) => api.delete<void>(`/api/scans/${id}`),
  create: (input: ScanCreateInput) => {
    const form = new FormData();
    form.append("answer_key_id", String(input.answer_key_id));
    input.images.forEach((img, i) => {
      form.append("images", img, (img as File).name || `page-${i + 1}.jpg`);
    });
    form.append("student_name", input.student_name);
    form.append("student_id",   input.student_id);
    if (input.exam_label) form.append("exam_label", input.exam_label);
    return api.upload<{ id: number; status: ScanStatus }>("/api/scans", form);
  },
};

// ── Plans / users ─────────────────────────────────────────────────────────────
export type PlanName = "free" | "smart" | "advanced";

export interface Capabilities {
  can_grade_mcq: boolean;
  can_grade_written: boolean;
  can_generate_questions: boolean;
  can_use_advanced_analytics: boolean;
  max_pages_per_scan: number;
  has_priority_processing: boolean;
}

export interface PlanInfo {
  plan: PlanName;
  free_scans_used: number;
  free_scans_limit: number;
  free_scans_remaining: number;
  can_scan: boolean;
  capabilities: Capabilities;
}

export const usersApi = {
  plan: () => api.get<PlanInfo>("/api/users/me/plan"),
  upgrade: (plan: PlanName) => api.post<PlanInfo>("/api/users/me/upgrade", { plan }),
};

// ── AI question generation ───────────────────────────────────────────────────
export type GeneratedType = "mcq" | "short" | "long" | "true_false";

export interface GeneratedQuestion {
  type: GeneratedType;
  marks: number;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  rubric: string | null;
}

export interface GenerateResponse {
  questions: GeneratedQuestion[];
  is_mock: boolean;
}

export const questionsApi = {
  generate: (data: { notes: string; count: number; types: GeneratedType[]; custom_prompt?: string }) =>
    api.post<GenerateResponse>("/api/questions/generate", data),
  uploadNotes: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ text: string; filename: string; char_count: number }>("/api/questions/upload-notes", form);
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  papers_scanned: number;
  average_score_pct: number | null;
  scans_this_week: number;
  last_scan_at: string | null;
}

export interface ScoreDistributionBucket {
  label: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  avg_pct: number;
  count: number;
}

export interface Analytics {
  distribution: ScoreDistributionBucket[];
  trend: TrendPoint[];
  total_scans: number;
}

export const analyticsApi = {
  dashboard: () => api.get<DashboardStats>("/api/analytics/dashboard"),
  full:      () => api.get<Analytics>("/api/analytics"),
};