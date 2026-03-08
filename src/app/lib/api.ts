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
  endDate: string | null;
  number: number;
  topics: string[];
  whatStoodOut: string;
  prepItems: string[];
  postMood: number;
  moodWord: string | null;
  completed: boolean;
  isCurrent: boolean;
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
  sessionFrequency: "weekly" | "biweekly" | "monthly" | "custom" | string;
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

export interface ApiCommunityReply {
  id: string;
  alias: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  liked: boolean;
}

export interface ApiCommunityPost {
  id: string;
  alias: string;
  title: string;
  body: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  liked: boolean;
  repliesCount: number;
  replies: ApiCommunityReply[];
}

export interface BillingResponse {
  message: string;
  user?: AuthUser;
  checkoutUrl?: string;
}

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const REQUEST_TIMEOUT_MS = 20_000;

const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your inputs and try again.",
  401: "Session expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "Requested resource was not found.",
  409: "Conflicting update detected. Please refresh and try again.",
  422: "Some fields are invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fallbackMessageForStatus(status: number) {
  if (STATUS_ERROR_MESSAGES[status]) return STATUS_ERROR_MESSAGES[status];
  if (status >= 500) return "Server error. Please try again in a moment.";
  return "Request failed. Please try again.";
}

function getErrorPayloadMessage(payload: ApiErrorPayload) {
  return typeof payload.error === "string" && payload.error.trim() ? payload.error.trim() : null;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  const hasBody = init.body !== undefined && init.body !== null;
  const isFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (hasBody && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your connection and try again.", 408);
    }
    throw new ApiError("Unable to reach the server. Please check your connection and try again.", 0);
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  let payload: ApiErrorPayload = {};

  if (contentType.includes("application/json")) {
    payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  } else {
    const text = await response.text().catch(() => "");
    payload = text ? { error: text } : {};
  }

  if (!response.ok) {
    const message = getErrorPayloadMessage(payload) ?? fallbackMessageForStatus(response.status);
    throw new ApiError(message, response.status, payload.code);
  }

  return payload as T;
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

export function getGoogleLoginApi(next?: string) {
  const params = new URLSearchParams({
    provider: "google",
    intent: "start",
  });
  if (next) {
    params.set("next", next);
  }

  return request<{ url: string }>(`/auth/login?${params.toString()}`, { method: "GET" });
}

export function meApi(token: string) {
  return request<{ user: AuthUser }>("/auth/me", { method: "GET" }, token);
}

export function updatePlanApi(plan: PlanType, token: string) {
  return request<BillingResponse>(
    "/billing/fake-payment",
    {
      method: "POST",
      body: JSON.stringify({ plan, action: "update" }),
    },
    token,
  );
}

export function startProCheckoutApi(token: string) {
  return request<BillingResponse>(
    "/billing/fake-payment",
    {
      method: "POST",
      body: JSON.stringify({ plan: "PRO", action: "start" }),
    },
    token,
  );
}

export function confirmProCheckoutApi(
  token: string,
  payload: { status?: string; paymentId?: string; sessionId?: string; checkoutId?: string; email?: string },
) {
  return request<BillingResponse>(
    "/billing/fake-payment",
    {
      method: "POST",
      body: JSON.stringify({
        plan: "PRO",
        action: "confirm",
        status: payload.status,
        paymentId: payload.paymentId,
        sessionId: payload.sessionId,
        checkoutId: payload.checkoutId,
        email: payload.email,
      }),
    },
    token,
  );
}

export function fakePaymentApi(plan: PlanType, token: string) {
  return updatePlanApi(plan, token);
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
    action?: "start" | "save";
    sessionId?: string;
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

export function startSessionApi(token: string, payload?: { date?: string }) {
  return request<{ session: ApiSession; homeworkItems: ApiHomeworkItem[]; started: boolean }>(
    "/sessions",
    {
      method: "POST",
      body: JSON.stringify({
        action: "start",
        date: payload?.date,
      }),
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
    "/profile",
    {
      method: "DELETE",
    },
    token,
  );
}

export function getCommunityPostsApi(
  token: string,
  params: {
    tag?: string;
    sort?: "trending" | "recent";
    search?: string;
    replies?: "all" | "with" | "without";
    cursor?: string | null;
    limit?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.tag && params.tag !== "All") query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.replies && params.replies !== "all") query.set("replies", params.replies);
  if (params.cursor) query.set("cursor", params.cursor);
  if (typeof params.limit === "number") query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{
    viewerAlias: string;
    posts: ApiCommunityPost[];
    tags: string[];
    filters: { tag: string; sort: "trending" | "recent"; search: string; replies: "all" | "with" | "without"; limit: number };
    pagination: { nextCursor: string | null; hasMore: boolean };
    reportReasons: string[];
  }>(`/community${suffix}`, { method: "GET" }, token);
}

export function createCommunityPostApi(
  token: string,
  payload: { title: string; body: string; tag: string },
) {
  return request<{ post: ApiCommunityPost }>(
    "/community",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function createCommunityCommentApi(
  token: string,
  payload: { postId: string; body: string },
) {
  return request<{ comment: ApiCommunityReply }>(
    "/community/comments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function toggleCommunityLikeApi(
  token: string,
  payload: { targetType: "post" | "comment"; targetId: string },
) {
  return request<{ targetType: "post" | "comment"; targetId: string; liked: boolean; likes: number }>(
    "/community/likes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function reportCommunityContentApi(
  token: string,
  payload: {
    targetType: "post" | "comment";
    targetId: string;
    reason: string;
    details?: string;
  },
) {
  return request<{ reported: boolean; duplicate?: boolean; openReports?: number }>(
    "/community/reports",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
