import type { TaxRule, AdminStats, RuleFilters, RuleCategory } from "./types";
import { ALL_MOCK_RULES } from "./mock-data";
import { addAuditEntry } from "./audit";

// In-memory store for mock; swap for real API calls to Django backend later
let store: TaxRule[] = [...ALL_MOCK_RULES];

function delay(ms = 120): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getRules(filters?: RuleFilters): Promise<TaxRule[]> {
  await delay();
  let result = [...store];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      r.plain_en.toLowerCase().includes(q) ||
      r.plain_nl.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (filters?.year && filters.year !== "all") result = result.filter(r => r.year === filters.year);
  if (filters?.user_type && filters.user_type !== "all") result = result.filter(r => r.user_types.includes(filters.user_type as never));
  if (filters?.verification_status && filters.verification_status !== "all") result = result.filter(r => r.verification_status === filters.verification_status);
  if (filters?.category && filters.category !== "all") result = result.filter(r => r.category === filters.category);

  return result.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getRuleById(id: string): Promise<TaxRule | undefined> {
  await delay();
  return store.find(r => r.id === id);
}

export async function createRule(rule: Omit<TaxRule, "created_at" | "updated_at">): Promise<TaxRule> {
  await delay();
  const now = new Date().toISOString();
  const newRule: TaxRule = { ...rule, created_at: now, updated_at: now };
  if (store.find(r => r.id === newRule.id)) throw new Error(`Rule ID ${newRule.id} already exists`);
  store = [...store, newRule];
  addAuditEntry(newRule.id, "created", "admin@taxwijs.nl", undefined, newRule, "Created via admin dashboard");
  return newRule;
}

export async function updateRule(id: string, updates: Partial<TaxRule>): Promise<TaxRule> {
  await delay();
  const existing = store.find(r => r.id === id);
  if (!existing) throw new Error(`Rule ${id} not found`);
  const before = { ...existing };
  const updated: TaxRule = { ...existing, ...updates, id, updated_at: new Date().toISOString() };
  store = store.map(r => r.id === id ? updated : r);
  addAuditEntry(id, "updated", "admin@taxwijs.nl", before, updates, "Updated via admin dashboard");
  return updated;
}

export async function duplicateRuleToYear(id: string, targetYear: number): Promise<TaxRule> {
  await delay();
  const source = store.find(r => r.id === id);
  if (!source) throw new Error(`Rule ${id} not found`);

  // Derive new ID: replace year part
  const idParts = id.split("-");
  idParts[1] = String(targetYear);
  const baseId = idParts.join("-");

  // Find next sequence number
  const existingInYear = store.filter(r => r.id.startsWith(`${idParts[0]}-${targetYear}-`));
  const seq = String(existingInYear.length + 1).padStart(3, "0");
  const newId = `${idParts[0]}-${targetYear}-${seq}`;

  const now = new Date().toISOString();
  const duplicate: TaxRule = {
    ...source,
    id: newId,
    year: targetYear,
    verification_status: "draft",
    effective_from: `${targetYear}-01-01`,
    effective_until: `${targetYear}-12-31`,
    supersedes: id,
    created_at: now,
    updated_at: now,
  };

  if (store.find(r => r.id === newId)) throw new Error(`Rule ${newId} already exists`);
  store = [...store, duplicate];
  addAuditEntry(newId, "duplicated", "admin@taxwijs.nl", undefined, duplicate, `Duplicated from ${id} to year ${targetYear}`);
  return duplicate;
}

export async function deleteRule(id: string): Promise<void> {
  await delay();
  const existing = store.find(r => r.id === id);
  if (!existing) throw new Error(`Rule ${id} not found`);
  store = store.filter(r => r.id !== id);
  addAuditEntry(id, "deleted", "admin@taxwijs.nl", existing, undefined, "Deleted via admin dashboard");
}

export async function getAdminStats(): Promise<AdminStats> {
  await delay();
  const today = new Date().toISOString().split("T")[0];
  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 60);
  const soon = soonDate.toISOString().split("T")[0];

  const byYear: Record<number, number> = {};
  const byCategory: Partial<Record<RuleCategory, number>> = {};

  for (const r of store) {
    byYear[r.year] = (byYear[r.year] ?? 0) + 1;
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  return {
    total: store.length,
    verified: store.filter(r => r.verification_status === "verified").length,
    draft: store.filter(r => r.verification_status === "draft").length,
    pending_review: store.filter(r => r.verification_status === "pending_review").length,
    expired: store.filter(r => r.verification_status === "expired" || (r.effective_until !== null && r.effective_until < today)).length,
    expiring_soon: store.filter(r => r.effective_until !== null && r.effective_until >= today && r.effective_until <= soon).length,
    by_year: byYear,
    by_category: byCategory,
  };
}
