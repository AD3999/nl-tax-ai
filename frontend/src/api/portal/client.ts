import { apiBase, authHeader } from "../client";
import type {
  ClientProfile, TaxEngagement, DocumentRequest, ClientDocument,
  ExtractedIncome, ExtractedExpense, ChecklistItem, AccountantAction,
  ReadinessResult, AuditLog,
} from "./types";

const base = `${apiBase}/portal`;

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${base}${path}`, { headers: authHeader() });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || `${r.status}`);
  }
  return r.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || `${r.status}`);
  }
  return r.json();
}

async function del(path: string): Promise<void> {
  const r = await fetch(`${base}${path}`, { method: "DELETE", headers: authHeader() });
  if (!r.ok) throw new Error(`${r.status}`);
}

// ── Clients ──────────────────────────────────────────────────────────────────
export const fetchClients = () => get<ClientProfile[]>("/clients/");
export const createClient = (data: Partial<ClientProfile>) => post<ClientProfile>("/clients/", data);
export const fetchClient  = (id: number) => get<ClientProfile>(`/clients/${id}/`);
export const updateClient = (id: number, data: Partial<ClientProfile>) => patch<ClientProfile>(`/clients/${id}/`, data);
export const archiveClient = (id: number) => del(`/clients/${id}/`);

// ── Engagements ───────────────────────────────────────────────────────────────
export const fetchEngagements = () => get<TaxEngagement[]>("/engagements/");
export const createEngagement = (data: Partial<TaxEngagement>) => post<TaxEngagement>("/engagements/", data);
export const fetchEngagement  = (id: number) => get<TaxEngagement>(`/engagements/${id}/`);
export const updateEngagement = (id: number, data: Partial<TaxEngagement>) => patch<TaxEngagement>(`/engagements/${id}/`, data);

// ── Checklist ─────────────────────────────────────────────────────────────────
export const fetchChecklist      = (engId: number) => get<ChecklistItem[]>(`/engagements/${engId}/checklist/`);
export const regenerateChecklist = (engId: number) => post<{ created: number }>(`/engagements/${engId}/checklist/regenerate/`, {});
export const updateChecklistItem = (id: number, data: Partial<ChecklistItem>) => patch<ChecklistItem>(`/checklist/${id}/`, data);

// ── Document Requests ──────────────────────────────────────────────────────────
export const fetchDocumentRequests = (engId: number) => get<DocumentRequest[]>(`/engagements/${engId}/document-requests/`);
export const createDocumentRequest = (engId: number, data: Partial<DocumentRequest>) => post<DocumentRequest>(`/engagements/${engId}/document-requests/`, data);
export const updateDocumentRequest = (id: number, data: Partial<DocumentRequest>) => patch<DocumentRequest>(`/document-requests/${id}/`, data);

// ── Documents ──────────────────────────────────────────────────────────────────
export const fetchDocuments   = (engId: number) => get<ClientDocument[]>(`/engagements/${engId}/documents/`);
export const reviewDocument   = (id: number, data: { processing_status: string; review_notes?: string }) => patch<ClientDocument>(`/documents/${id}/review/`, data);

export async function uploadDocument(
  engagementId: number,
  clientProfileId: number,
  file: File,
  documentRequestId?: number,
): Promise<ClientDocument> {
  const formData = new FormData();
  formData.append("engagement", String(engagementId));
  formData.append("client_profile", String(clientProfileId));
  formData.append("file", file);
  if (documentRequestId) {
    formData.append("document_request", String(documentRequestId));
  }
  const r = await fetch(`${base}/documents/upload/`, {
    method: "POST",
    headers: authHeader(),  // NO Content-Type — browser sets multipart boundary
    body: formData,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || `${r.status}`);
  }
  return r.json();
}

// ── Extracted Income / Expense ────────────────────────────────────────────────
export const fetchIncome   = (engId: number) => get<ExtractedIncome[]>(`/engagements/${engId}/income/`);
export const updateIncome  = (id: number, data: Partial<ExtractedIncome>) => patch<ExtractedIncome>(`/income/${id}/`, data);
export const fetchExpenses = (engId: number) => get<ExtractedExpense[]>(`/engagements/${engId}/expenses/`);
export const updateExpense = (id: number, data: Partial<ExtractedExpense>) => patch<ExtractedExpense>(`/expenses/${id}/`, data);

// ── Actions ───────────────────────────────────────────────────────────────────
export const fetchActions    = (engId: number) => get<AccountantAction[]>(`/engagements/${engId}/actions/`);
export const generateActions = (engId: number) => post<AccountantAction[]>(`/engagements/${engId}/generate-actions/`, {});
export const updateAction    = (id: number, data: Partial<AccountantAction>) => patch<AccountantAction>(`/actions/${id}/`, data);

// ── Readiness & Risks ─────────────────────────────────────────────────────────
export const recalculateReadiness = (engId: number) => post<ReadinessResult>(`/engagements/${engId}/recalculate-readiness/`, {});
export const fetchRisks = (engId: number) => get<{ client_type: string; opportunities: unknown[]; risks: unknown[] }>(`/engagements/${engId}/risks/`);

// ── Reminder ──────────────────────────────────────────────────────────────────
export const sendReminder = (engId: number) => post<{ subject: string; body: string; missing_count: number }>(`/engagements/${engId}/send-reminder/`, {});

// ── Audit ─────────────────────────────────────────────────────────────────────
export const fetchAudit = (engId: number) => get<AuditLog[]>(`/engagements/${engId}/audit/`);

// ── Client self-service ───────────────────────────────────────────────────────
export const fetchClientProfile    = () => get<ClientProfile>("/client/profile/");
export const fetchClientEngagement = () => get<TaxEngagement>("/client/engagement/");
export const fetchClientTasks      = () => get<{ tasks: unknown[]; total: number; completed: number; readiness_score: number }>("/client/tasks/");
export const fetchClientDocuments  = () => get<ClientDocument[]>("/client/documents/");
