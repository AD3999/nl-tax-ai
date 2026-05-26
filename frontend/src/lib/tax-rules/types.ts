export type VerificationStatus = "verified" | "pending_review" | "draft" | "expired";
export type UserType = "zzp" | "employee" | "expat" | "dga" | "accountant" | "all";
export type RuleCategory =
  | "bracket"
  | "deduction"
  | "credit"
  | "contribution"
  | "exemption"
  | "rate"
  | "deadline"
  | "compliance"
  | "detection"
  | "benefit";
export type ResultType =
  | "fixed_amount"
  | "percentage"
  | "bracket"
  | "formula"
  | "cap"
  | "threshold"
  | "phase_out"
  | "boolean"
  | "date";
export type AuditAction = "created" | "updated" | "status_changed" | "duplicated" | "deleted";

export interface RuleCondition {
  is_entrepreneur?: boolean;
  hours_gte?: number;
  hours_lt?: number;
  income_lte?: number;
  income_gte?: number;
  profit_gte?: number;
  user_type?: UserType;
  has_child_under_12?: boolean;
  is_aow_age?: boolean;
  is_starter?: boolean;
  shareholding_pct_gte?: number;
  assets_gte?: number;
  [key: string]: unknown;
}

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  label?: string;
}

export interface PhaseOut {
  income_start: number;
  income_end: number;
  max_credit: number;
  reduction_per_euro?: number;
}

export interface RuleResult {
  type: ResultType;
  value?: number;
  unit?: "pct" | "eur" | "hours" | "date" | "string";
  formula?: string;
  cap?: number;
  threshold?: number;
  brackets?: TaxBracket[];
  phase_out?: PhaseOut;
  notes?: string;
}

export interface TaxRule {
  id: string;              // "ZA-2026-001"
  year: number;
  topic: string;
  category: RuleCategory;
  user_types: UserType[];
  condition: RuleCondition;
  result: RuleResult;
  plain_nl: string;
  plain_en: string;
  plain_fa: string;
  source_url: string;
  verification_status: VerificationStatus;
  effective_from: string;  // "2026-01-01"
  effective_until: string | null;
  ai_prompt_hint: string;
  tags: string[];
  supersedes?: string;
  created_at: string;
  updated_at: string;
  user_facing_question_nl?: string;
  user_facing_question_en?: string;
  user_facing_question_fa?: string;
}

export interface AuditEntry {
  id: string;
  rule_id: string;
  action: AuditAction;
  changed_by: string;
  changed_at: string;
  before?: Partial<TaxRule>;
  after?: Partial<TaxRule>;
  note?: string;
}

export interface AdminStats {
  total: number;
  verified: number;
  draft: number;
  pending_review: number;
  expired: number;
  expiring_soon: number;
  by_year: Record<number, number>;
  by_category: Partial<Record<RuleCategory, number>>;
}

export interface RuleFilters {
  search?: string;
  year?: number | "all";
  user_type?: UserType | "all";
  verification_status?: VerificationStatus | "all";
  category?: RuleCategory | "all";
}
