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

// XHR-based upload so callers can track progress via onProgress (0-100).
// Do NOT set Content-Type — browser must set multipart/form-data with boundary.
function xhrUpload<T>(
  url: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    const headers = authHeader();
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Invalid response from server")); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as Record<string, unknown>;
          const first = Object.values(err)[0];
          const msg = Array.isArray(first) ? String(first[0]) : (err.detail as string) ?? JSON.stringify(err);
          reject(new Error(msg));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror   = () => reject(new Error("Network error — check your connection"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(formData);
  });
}

export function uploadDocument(
  engagementId: number,
  clientProfileId: number,
  file: File,
  options?: { userTitle?: string; userNote?: string; documentRequestId?: number; onProgress?: (pct: number) => void },
): Promise<ClientDocument> {
  const formData = new FormData();
  formData.append("engagement", String(engagementId));
  formData.append("client_profile", String(clientProfileId));
  formData.append("file", file);
  if (options?.userTitle)  formData.append("user_title", options.userTitle);
  if (options?.userNote)   formData.append("user_note",  options.userNote);
  if (options?.documentRequestId) formData.append("document_request", String(options.documentRequestId));
  return xhrUpload<ClientDocument>(`${base}/documents/upload/`, formData, options?.onProgress);
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
export const updateClientTask      = (id: number, data: { status: string; meta_value?: string }) => patch<ChecklistItem>(`/client/tasks/${id}/`, data);

export async function deleteClientDocument(id: number): Promise<void> {
  const r = await fetch(`${base}/client/documents/${id}/`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`${r.status}`);
}

export function uploadClientDocument(
  engagementId: number,
  clientProfileId: number,
  file: File,
  title: string,
  note: string,
  documentRequestId?: number,
  onProgress?: (pct: number) => void,
): Promise<ClientDocument> {
  const formData = new FormData();
  formData.append("engagement", String(engagementId));
  formData.append("client_profile", String(clientProfileId));
  formData.append("file", file);
  if (title) formData.append("user_title", title);
  if (note)  formData.append("user_note", note);
  if (documentRequestId) formData.append("document_request", String(documentRequestId));
  return xhrUpload<ClientDocument>(`${base}/documents/upload/`, formData, onProgress);
}
