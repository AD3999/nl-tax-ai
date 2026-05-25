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

export async function sendMessage(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  onToken: (token: string, meta?: TokenMeta) => void,
  signal?: AbortSignal,
  userProfile?: Record<string, unknown>,
  sessionMessageCount = 0,
): Promise<void> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_BASE}/chat/message/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      session_message_count: sessionMessageCount,
      ...(userProfile ? { user_profile: userProfile } : {}),
    }),
    signal,
  });

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
