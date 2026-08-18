/**
 * Chat API — thin wrapper around ML-Backend chat endpoints.
 */
const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  model?: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${ML_BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat failed (${res.status})`);
  }
  return res.json();
}

export async function sendChatMessageStream(
  data: ChatRequest,
  onToken: (token: string) => void,
  onError: (error: Error) => void,
): Promise<void> {
  try {
    const res = await fetch(`${ML_BACKEND_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Stream failed (${res.status})`);
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
        } else if (line.startsWith("event: error") && lines[i + 1]?.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(lines[i + 1].slice(6));
            onError(new Error(parsed.error || "Stream error"));
          } catch {
            onError(new Error("Stream error"));
          }
          return;
        }
      }
    }
  } catch (err) {
    onError(err as Error);
  }
}
