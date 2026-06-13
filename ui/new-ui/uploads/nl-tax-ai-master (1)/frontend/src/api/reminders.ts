import { apiBase, authHeader } from "./client";

export type Reminder = {
  id: number;
  title: string;
  description: string;
  category: string;
  due_date: string;
  days_until: number;
  action_type: string;
  source_url: string;
  user_types: string[];
  reminder_offsets: number[];
};

export async function fetchReminders(lang = "en", days = 90): Promise<Reminder[]> {
  const r = await fetch(`${apiBase}/users/reminders/?lang=${lang}&days=${days}`, {
    headers: authHeader(),
  });
  if (!r.ok) return [];
  return r.json();
}

export type ConversationSummary = {
  id: number;
  summary: string;
  message_count: number;
  language: string;
  created_at: string;
  updated_at: string;
};

export type ConversationDetail = ConversationSummary & {
  messages: Array<{ role: "user" | "assistant"; content: string; created_at: string }>;
};

export async function fetchConversationHistory(): Promise<ConversationSummary[]> {
  const r = await fetch(`${apiBase}/users/chat-history/`, { headers: authHeader() });
  if (!r.ok) return [];
  return r.json();
}

export async function fetchConversation(id: number): Promise<ConversationDetail | null> {
  const r = await fetch(`${apiBase}/users/chat-history/${id}/`, { headers: authHeader() });
  if (!r.ok) return null;
  return r.json();
}

export async function captureEmail(email: string, sourcePage = "landing", userType = ""): Promise<void> {
  await fetch(`${apiBase}/users/email-capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source_page: sourcePage, user_type: userType }),
  });
}
