import type { AuditEntry, AuditAction, TaxRule } from "./types";

const AUDIT_LOG: AuditEntry[] = [
  {
    id: "audit-001",
    rule_id: "ZA-2026-001",
    action: "created",
    changed_by: "admin@taxwijs.nl",
    changed_at: "2026-01-01T09:00:00Z",
    note: "Initial 2026 rules seeded from Prinsjesdag 2025 announcement",
  },
  {
    id: "audit-002",
    rule_id: "ZVW-2026-001",
    action: "updated",
    changed_by: "admin@taxwijs.nl",
    changed_at: "2026-03-15T14:22:00Z",
    before: { result: { type: "percentage", value: 5.32, unit: "pct" } },
    after: { result: { type: "percentage", value: 4.85, unit: "pct" } },
    note: "Corrected ZVW rate from 5.32% to 4.85% — confirmed via Belastingdienst fisin2026",
  },
  {
    id: "audit-003",
    rule_id: "SA-2026-001",
    action: "updated",
    changed_by: "admin@taxwijs.nl",
    changed_at: "2026-01-10T11:00:00Z",
    after: { ai_prompt_hint: "CRITICAL: This is the last year for startersaftrek. Abolished from 2027." },
    note: "Added critical warning to AI prompt hint",
  },
  {
    id: "audit-004",
    rule_id: "ZA-2027-001",
    action: "created",
    changed_by: "admin@taxwijs.nl",
    changed_at: "2026-05-01T10:00:00Z",
    note: "Draft 2027 rule — placeholder pending Prinsjesdag 2026",
  },
];

let auditLog = [...AUDIT_LOG];

export function getAuditLog(ruleId?: string): AuditEntry[] {
  if (ruleId) return auditLog.filter(e => e.rule_id === ruleId).sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  return [...auditLog].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
}

export function addAuditEntry(
  ruleId: string,
  action: AuditAction,
  changedBy: string,
  before?: Partial<TaxRule>,
  after?: Partial<TaxRule>,
  note?: string,
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}`,
    rule_id: ruleId,
    action,
    changed_by: changedBy,
    changed_at: new Date().toISOString(),
    before,
    after,
    note,
  };
  auditLog = [entry, ...auditLog];
  return entry;
}
