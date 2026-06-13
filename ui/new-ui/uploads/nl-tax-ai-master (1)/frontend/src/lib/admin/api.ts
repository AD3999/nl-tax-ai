const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  user_type: string;
  plan: "free" | "premium";
  preferred_language: string;
  tax_year: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  daily_message_count: number;
  intake_profile?: Record<string, unknown> | null;
  tax_memory?: Record<string, unknown> | null;
}

export interface AdminConversation {
  id: number;
  user_id: number | null;
  user_email: string | null;
  language: string;
  tax_year: number;
  summary: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: AdminMessage[];
}

export interface AdminMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getAdminUsers(params?: {
  search?: string;
  plan?: string;
  user_type?: string;
  is_active?: string;
}): Promise<{ users: AdminUser[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.plan) q.set("plan", params.plan);
  if (params?.user_type) q.set("user_type", params.user_type);
  if (params?.is_active) q.set("is_active", params.is_active);
  const res = await fetch(`${API_BASE}/users/admin/list/?${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json() as Promise<{ users: AdminUser[]; total: number }>;
}

export async function getAdminUser(id: number): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users/admin/${id}/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("User not found");
  return res.json() as Promise<AdminUser>;
}

export async function updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users/admin/${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json() as Promise<AdminUser>;
}

export async function getAdminChatLogs(params?: {
  search?: string;
  lang?: string;
}): Promise<{ conversations: AdminConversation[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.lang) q.set("lang", params.lang);
  const res = await fetch(`${API_BASE}/chat/admin/logs/?${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load chat logs");
  return res.json() as Promise<{ conversations: AdminConversation[]; total: number }>;
}

export async function getAdminChatDetail(id: number): Promise<AdminConversation> {
  const res = await fetch(`${API_BASE}/chat/admin/logs/${id}/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Conversation not found");
  return res.json() as Promise<AdminConversation>;
}
