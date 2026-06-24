import { apiBase, authHeader } from "./client";

export interface ClientInvitation {
  id: number;
  inv_type: "accountant" | "portal";
  firm_name: string;
  accountant_email: string;
  message: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  created_at: string;
  /** Portal invitations only — used when accepting from the dashboard */
  token?: string;
}

export interface SentInvitation {
  id: number;
  invited_email: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  message: string;
  client_name: string | null;
  created_at: string;
  /** Portal only — link to share with the client */
  accept_url?: string | null;
  expires_at?: string | null;
}

export async function fetchClientInvitations(): Promise<ClientInvitation[]> {
  const res = await fetch(`${apiBase}/users/client/invitations/`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json() as Promise<ClientInvitation[]>;
}

export async function respondToInvitation(
  inv: ClientInvitation,
  action: "accept" | "decline",
): Promise<{ status: string }> {
  const res = await fetch(`${apiBase}/users/client/invitations/${inv.id}/respond/`, {
    method:  "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body:    JSON.stringify({ action, inv_type: inv.inv_type }),
  });
  if (!res.ok) throw new Error("Failed to respond to invitation");
  return res.json() as Promise<{ status: string }>;
}

export async function fetchSentInvitations(): Promise<SentInvitation[]> {
  const res = await fetch(`${apiBase}/portal/invitations/sent/`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json() as Promise<SentInvitation[]>;
}

export async function sendInvitation(email: string, message = ""): Promise<SentInvitation> {
  const res = await fetch(`${apiBase}/portal/invitations/send/`, {
    method:  "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body:    JSON.stringify({ email, message, client_name: "", tax_year: 2026 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string; error?: string };
    throw new Error(err.detail ?? err.error ?? "Failed to send invitation");
  }
  // Portal send returns {id, token, client_email, status, accept_url, expires_at}
  // Normalise to SentInvitation shape
  const data = await res.json() as {
    id: number; client_email: string; status: string;
    accept_url: string; expires_at: string; message?: string;
  };
  return {
    id:            data.id,
    invited_email: data.client_email,
    status:        data.status as SentInvitation["status"],
    message:       message,
    client_name:   null,
    created_at:    new Date().toISOString().split("T")[0],
    accept_url:    data.accept_url,
    expires_at:    data.expires_at,
  };
}

export async function cancelInvitation(id: number): Promise<void> {
  await fetch(`${apiBase}/portal/invitations/${id}/cancel/`, {
    method:  "DELETE",
    headers: authHeader(),
  });
}
