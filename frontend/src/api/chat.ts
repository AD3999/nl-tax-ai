import { client } from "./client";

// Resolve base URL for native fetch (streaming) — same logic as client.ts
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

/**
 * Stream a message to the Phase 4 chat endpoint.
 * `onToken` is called for each text token as it arrives.
 * Returns when the stream is complete or the AbortSignal fires.
 */
export interface TokenMeta {
  upgrade_required?: boolean;
  reason?: string;
  limit?: number;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access: string };
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch {
    return null;
  }
}

export interface ExplainAlert {
  id: string;
  title: string;
  body: string;
  category: string;
}

export async function sendMessage(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  onToken: (token: string, meta?: TokenMeta) => void,
  signal?: AbortSignal,
  userProfile?: Record<string, unknown>,
  sessionMessageCount = 0,
  intakeMode = false,
  language: "nl" | "en" | "fa" = "nl",
  explainAlert?: ExplainAlert | null,
): Promise<void> {
  let token = localStorage.getItem("access_token");

  const body = JSON.stringify({
    message,
    conversation_history: conversationHistory,
    session_message_count: sessionMessageCount,
    intake_mode: intakeMode,
    language,
    ...(userProfile ? { user_profile: userProfile } : {}),
    ...(explainAlert?.id ? { explain_alert: explainAlert } : {}),
  });

  const makeRequest = (authToken: string | null) =>
    fetch(`${API_BASE}/chat/message/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body,
      signal,
    });

  let response = await makeRequest(token);

  // On 401: try to refresh the access token once, then retry.
  // If refresh fails, retry without a token (anonymous — AllowAny view allows it).
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) localStorage.removeItem("access_token");
    token = newToken;
    response = await makeRequest(token);
  }

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let data: { text?: string; done?: boolean; error?: string; upgrade_required?: boolean; reason?: string; limit?: number };
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (data.error) throw new Error(data.error);
      if (data.upgrade_required) { onToken("", { upgrade_required: true, reason: data.reason, limit: data.limit }); return; }
      if (data.text) onToken(data.text);
    }
  }
}

export interface AskPayload {
  question: string;
  conversation_id?: number | null;
  language?: "nl" | "en" | "fa";
}

export interface AskResponse {
  task_id: string;
  conversation_id: number;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  retrieved_sources: string[];
  created_at: string;
}

export interface Conversation {
  id: number;
  language: string;
  tax_year: number;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export const ask = async (payload: AskPayload): Promise<AskResponse> => {
  const { data } = await client.post<AskResponse>("/chat/ask/", payload);
  return data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const { data } = await client.get<Conversation>(`/chat/conversations/${id}/`);
  return data;
};

export const listConversations = async (): Promise<Conversation[]> => {
  const { data } = await client.get<Conversation[]>("/chat/conversations/");
  return data;
};
