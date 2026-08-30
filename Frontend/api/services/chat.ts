/**
 * Chat API — thin wrapper around ML-Backend chat endpoints.
 */
const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const access = data.access as string | undefined;
    if (!access) return null;
    localStorage.setItem("access_token", access);
    return access;
  } catch {
    return null;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function mlFetch(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
  requestId?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const auth = await getAuthHeader();
  for (const [k, v] of Object.entries(auth)) headers.set(k, v);
  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  let res = await fetch(`${ML_BACKEND_URL}${path}`, { ...init, headers, signal });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(`${ML_BACKEND_URL}${path}`, { ...init, headers, signal });
    }
  }
  return res;
}

export async function sendDebugEvent(requestId: string, event: Record<string, unknown>) {
  try {
    await fetch(`${ML_BACKEND_URL}/debug/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader()),
      },
      body: JSON.stringify({ ...event, request_id: requestId }),
    });
  } catch {
    // ignore debug event failures
  }
}

function extractErrorMessage(status: number, text: string): string {
  if (!text) {
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You don't have permission to access this resource.";
    if (status === 404) return "The requested resource was not found.";
    if (status >= 500) return "The AI service is temporarily unavailable. Please try again later.";
    return `Request failed (${status})`;
  }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === "string") return parsed.detail;
    if (typeof parsed.error === "string") return parsed.error;
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // not JSON, return as-is
  }
  return text;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  structured?: StructuredResponse;
}

export interface ChatRequest {
  message: string;
  model?: string;
  conversation_id?: string;
}

export interface StructuredResponse {
  type: "text" | "markdown" | "metrics" | "table" | "transactions" | "alerts" | "insights" | "recommendations" | "chart" | "tool_result" | "error";
  text?: string;
  markdown?: string;
  metrics?: Array<{
    label: string;
    value: unknown;
    format?: string;
    metadata?: Record<string, unknown>;
  }>;
  table?: {
    columns: Array<{ key: string; label: string; format?: string; align?: string }>;
    rows: Array<Record<string, unknown>>;
    caption?: string;
    empty_message?: string;
  };
  transactions?: {
    columns: Array<{ key: string; label: string; format?: string; align?: string }>;
    rows: Array<Record<string, unknown>>;
    caption?: string;
    empty_message?: string;
  };
  alerts?: Array<Record<string, unknown>>;
  insights?: Array<Record<string, unknown>>;
  recommendations?: string[];
  chart?: {
    type: "line" | "bar" | "pie" | "donut";
    data: Array<Record<string, unknown>>;
    x_key?: string;
    y_key?: string;
    label_key?: string;
    value_key?: string;
    title?: string;
  };
  tool_result?: {
    tool: string;
    status: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    latency_ms?: number;
  };
  error?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  model: string;
  conversation_id: string;
  structured?: StructuredResponse;
}

export async function sendChatMessage(data: ChatRequest, requestId?: string): Promise<ChatResponse> {
  const res = await mlFetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, undefined, requestId);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(extractErrorMessage(res.status, text));
  }
  return res.json();
}

export async function sendChatMessageStream(
  data: ChatRequest,
  onToken: (token: string) => void,
  onError: (error: Error) => void,
  onStructured?: (structured: StructuredResponse) => void,
  signal?: AbortSignal,
  requestId?: string,
): Promise<void> {
  try {
    const res = await mlFetch("/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal,
    }, undefined, requestId);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(extractErrorMessage(res.status, text));
    }
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      if (!buffer.endsWith("\n")) {
        buffer = lines.pop() || "";
      } else {
        buffer = "";
      }
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("event: token") && lines[i + 1]?.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(lines[i + 1].slice(6));
            if (parsed.token) onToken(parsed.token);
          } catch {
            // ignore malformed JSON
          }
        } else if (line.startsWith("event: done") && lines[i + 1]?.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(lines[i + 1].slice(6));
            if (parsed.structured) {
              onStructured?.(parsed.structured);
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      onError(new Error("Request cancelled by user."));
      return;
    }
    onError(err as Error);
  }
}

export interface AgentMessageRequest {
  message: string;
  agent?: string;
  conversation_id?: string;
}

export async function sendAgentMessage(
  data: AgentMessageRequest,
  onToken: (token: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal,
  requestId?: string,
): Promise<void> {
  try {
    const res = await mlFetch("/chat/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal,
    }, undefined, requestId);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(extractErrorMessage(res.status, text));
    }
    const result: { response?: string; error?: string } = await res.json();
    if (result.error) {
      onError(new Error(result.error));
      return;
    }
    const reply = (result.response || "").trim();
    if (!reply) {
      onError(new Error("The AI assistant returned an empty response. Please try again."));
      return;
    }
    const tokens = reply.match(/.{1,4}/g) || [reply];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < tokens.length) {
        onToken(tokens[idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 10);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      onError(new Error("Request cancelled by user."));
      return;
    }
    onError(err as Error);
  }
}
