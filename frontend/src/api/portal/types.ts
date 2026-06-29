export type ClientType = "employee" | "zzp" | "expat" | "dga" | "other";
export type ClientStatus = "invited" | "active" | "collecting" | "in_review" | "ready" | "completed" | "archived" | "deactivated";
export type EngagementStatus = "draft" | "collecting" | "waiting_client" | "needs_review" | "ready_to_file" | "filed" | "completed" | "blocked";
export type RiskLevel = "low" | "medium" | "high";
export type ReviewStatus = "candidate" | "approved" | "rejected" | "manual";
export type ChecklistStatus = "todo" | "waiting_client" | "uploaded" | "needs_review" | "accepted" | "rejected" | "waived";
export type DocProcessingStatus = "uploaded" | "processing" | "extracted" | "needs_review" | "approved" | "rejected";

export interface ClientProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  client_type: ClientType;
  preferred_language: "nl" | "en" | "fa";
  phone: string;
  status: ClientStatus;
  tax_year: number;
  notes: string;
  display_name: string;
  engagement_count: number;
  latest_readiness: number | null;
  latest_missing_count: number;
  latest_risk_level: "low" | "medium" | "high";
  latest_engagement_status: EngagementStatus | null;
  latest_engagement_id: number | null;
  accountant_display?: { name: string; email: string; is_verified?: boolean } | null;
  deactivated_at: string | null;
  scheduled_deletion_at: string | null;
  days_until_deletion: number | null;
  /** null means the client hasn't accepted/linked their account yet (status="invited") */
  client_user: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaxEngagement {
  id: number;
  accountant: number;
  client_profile: number;
  client_profile_display: string;
  tax_year: number;
  engagement_type: string;
  status: EngagementStatus;
  deadline_date: string | null;
  readiness_score: number;
  missing_items_count: number;
  risk_level: RiskLevel;
  summary_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequest {
  id: number;
  engagement: number;
  client_profile: number;
  title: string;
  description: string;
  request_type: string;
  required: boolean;
  status: string;
  due_date: string | null;
  ai_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: number;
  engagement: number;
  client_profile: number;
  document_request: number | null;
  uploaded_by: number | null;
  original_filename: string;
  user_title: string;
  user_note: string;
  file_url: string | null;
  mime_type: string;
  file_size: number;
  document_type: string;
  processing_status: DocProcessingStatus;
  extracted_json: Record<string, unknown> | null;
  confidence_score: number | null;
  review_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedIncome {
  id: number;
  engagement: number;
  client_profile: number;
  source_document: number | null;
  income_type: string;
  description: string;
  gross_amount: string;
  tax_withheld: string | null;
  period_start: string | null;
  period_end: string | null;
  currency: string;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ExtractedExpense {
  id: number;
  engagement: number;
  client_profile: number;
  source_document: number | null;
  expense_category: string;
  description: string;
  amount_gross: string;
  amount_net: string | null;
  vat_amount: string | null;
  business_use_percentage: number | null;
  expense_date: string | null;
  supplier_name: string;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: number;
  engagement: number;
  client_profile: number;
  title: string;
  description: string;
  category: string;
  required: boolean;
  status: ChecklistStatus;
  source: string;
  priority: string;
  stable_key: string;
  task_type?: "document" | "info";
  meta_value?: string | null;
  rejection_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountantAction {
  id: number;
  engagement: number;
  client_profile: number;
  title: string;
  body: string;
  action_type: string;
  priority: string;
  status: "open" | "done" | "dismissed";
  source: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ReadinessResult {
  score: number;
  missing_required: number;
  needs_review: number;
  accepted: number;
  risk_level: RiskLevel;
  blocking_reasons: string[];
  next_actions: string[];
  ready_to_file: boolean;
}

export interface RiskOpportunity {
  id: string;
  title: string;
  description: string;
  confidence?: string;
  level?: string;
  rule_id?: string;
  source_url?: string;
}

export interface AuditLog {
  id: number;
  actor_user: number | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}
