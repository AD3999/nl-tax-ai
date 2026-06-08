import { apiBase, authHeader } from "./client";

export interface ClientInvitation {
  id: number;
  firm_name: string;
  accountant_email: string;
  message: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
}

export interface SentInvitation {
  id: number;
  invited_email: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message: string;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchClientInvitations(): Promise<ClientInvitation[]> {
  const res = await fetch(`${apiBase}/users/client/invitations/`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json() as Promise<ClientInvitation[]>;
}

export async function respondToInvitation(
  id: number,
  action: "accept" | "decline",
): Promise<{ status: string }> {
  const res = await fetch(`${apiBase}/users/client/invitations/${id}/respond/`, {
    method:  "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body:    JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Failed to respond to invitation");
  return res.json() as Promise<{ status: string }>;
}

export async function fetchSentInvitations(): Promise<SentInvitation[]> {
  const res = await fetch(`${apiBase}/users/accountant/invitations/`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json() as Promise<SentInvitation[]>;
}

export async function sendInvitation(email: string, message = ""): Promise<SentInvitation> {
  const res = await fetch(`${apiBase}/users/accountant/invitations/`, {
    method:  "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body:    JSON.stringify({ email, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Failed to send invitation");
  }
  return res.json() as Promise<SentInvitation>;
}

export async function cancelInvitation(id: number): Promise<void> {
  await fetch(`${apiBase}/users/accountant/invitations/${id}/`, {
    method:  "DELETE",
    headers: authHeader(),
  });
}
