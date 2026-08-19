/**
 * Conversations API — thin wrapper around ML-Backend chat endpoints.
 */
const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";

export interface Conversation {
  id: string;
  title: string | null;
  status: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  results: Conversation[];
  count: number;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listConversations(): Promise<ConversationListResponse> {
  const res = await fetch(`${ML_BACKEND_URL}/chats`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversations (${res.status})`);
  }
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${ML_BACKEND_URL}/chats/${encodeURIComponent(id)}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversation (${res.status})`);
  }
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${ML_BACKEND_URL}/chats/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete conversation (${res.status})`);
  }
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const res = await fetch(`${ML_BACKEND_URL}/chats/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Failed to rename conversation (${res.status})`);
  }
  return res.json();
}

export async function createConversation(): Promise<Conversation> {
  const res = await fetch(`${ML_BACKEND_URL}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to create conversation (${res.status})`);
  }
  return res.json();
}
