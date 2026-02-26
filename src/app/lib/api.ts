export type PlanType = "FREE" | "PRO";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  plan: PlanType;
}

export type EntryType = "trigger" | "event" | "thought" | "win";

export interface ApiLogEntry {
  id: string;
  text: string;
  type: EntryType;
  intensity: number;
  addedToPrep: boolean;
  prepNote: string | null;
  checkedOff: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSession {
  id: string;
  date: string;
  number: number;
  topics: string[];
  whatStoodOut: string;
  prepItems: string[];
  postMood: number;
  moodWord: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiHomeworkItem {
  id: string;
  userId: string;
  sessionId: string | null;
  text: string;
  sessionDate: string;
  dueDate: string | null;
  completed: boolean;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProfile {
  id: string;
  displayName: string;
  therapistName: string | null;
  sessionFrequency: "weekly" | "biweekly" | "monthly" | string;
  sessionDay: string;
  sessionTime: string;
  nextSessionDate: string | null;
  preSessionReminder: number;
  postSessionReminder: number;
  enablePreReminder: boolean;
  enablePostReminder: boolean;
  enableHomeworkReminder: boolean;
  enableWeeklyNudge: boolean;
  theme: "dark" | "light" | "system" | string;
  fontSize: "standard" | "large" | string;
  aiSuggestions: boolean;
  onboarded: boolean;
}

interface ApiErrorPayload {
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status);
  }

  return data;
}

export function signupApi(payload: { email: string; password: string; name?: string }) {
  return request<{ token: string; user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginApi(payload: { email: string; password: string }) {
  return request<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function meApi(token: string) {
  return request<{ user: AuthUser }>("/auth/me", { method: "GET" }, token);
}

export function fakePaymentApi(plan: PlanType, token: string) {
  return request<{ message: string; user: AuthUser }>(
    "/billing/fake-payment",
    {
      method: "POST",
      body: JSON.stringify({ plan }),
    },
    token,
  );
}

export function getLogsApi(token: string, view: "active" | "archive" | "all" = "active") {
  return request<{ logs: ApiLogEntry[] }>(`/logs?view=${view}`, { method: "GET" }, token);
}

export function createLogApi(
  token: string,
  payload: {
    text: string;
    type: EntryType;
    intensity: number;
    addedToPrep?: boolean;
    prepNote?: string;
    checkedOff?: boolean;
  },
) {
  return request<{ log: ApiLogEntry }>(
    "/logs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateLogApi(
  token: string,
  id: string,
  payload: Partial<Pick<ApiLogEntry, "text" | "type" | "intensity" | "addedToPrep" | "prepNote" | "checkedOff">>,
) {
  return request<{ log: ApiLogEntry }>(
    `/logs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteLogApi(token: string, id: string) {
  return request<Record<string, never>>(
    `/logs/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function getSessionsApi(token: string, completed?: boolean) {
  const query = typeof completed === "boolean" ? `?completed=${completed}` : "";
  return request<{ sessions: ApiSession[] }>(`/sessions${query}`, { method: "GET" }, token);
}

export function createSessionApi(
  token: string,
  payload: {
    date: string;
    topics: string[];
    whatStoodOut: string;
    prepItems: string[];
    postMood: number;
    moodWord?: string;
    completed?: boolean;
    homeworkItems?: Array<{ text: string; dueDate?: string }>;
  },
) {
  return request<{ session: ApiSession; homeworkItems: ApiHomeworkItem[] }>(
    "/sessions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateSessionApi(
  token: string,
  id: string,
  payload: Partial<Pick<ApiSession, "date" | "topics" | "whatStoodOut" | "prepItems" | "postMood" | "moodWord" | "completed">>,
) {
  return request<{ session: ApiSession }>(
    `/sessions/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteSessionApi(token: string, id: string) {
  return request<Record<string, never>>(
    `/sessions/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function getHomeworkApi(token: string, completed?: boolean) {
  const query = typeof completed === "boolean" ? `?completed=${completed}` : "";
  return request<{ homework: ApiHomeworkItem[] }>(`/homework${query}`, { method: "GET" }, token);
}

export function createHomeworkApi(
  token: string,
  payload: { text: string; sessionId?: string; sessionDate: string; dueDate?: string },
) {
  return request<{ homework: ApiHomeworkItem }>(
    "/homework",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateHomeworkApi(
  token: string,
  id: string,
  payload: Partial<Pick<ApiHomeworkItem, "text" | "completed" | "dueDate">>,
) {
  return request<{ homework: ApiHomeworkItem }>(
    `/homework/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteHomeworkApi(token: string, id: string) {
  return request<Record<string, never>>(
    `/homework/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function getProfileApi(token: string) {
  return request<{ profile: ApiProfile }>("/profile", { method: "GET" }, token);
}

export function updateProfileApi(token: string, payload: Partial<ApiProfile>) {
  return request<{ profile: ApiProfile }>(
    "/profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteAccountApi(token: string) {
  return request<Record<string, never>>(
    "/account",
    {
      method: "DELETE",
    },
    token,
  );
}
