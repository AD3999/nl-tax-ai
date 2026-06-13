import type { TaxRule, AdminStats, RuleFilters, RuleCategory } from "./types";
import { ALL_MOCK_RULES } from "./mock-data";
import { addAuditEntry } from "./audit";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Map Django model fields → frontend TaxRule shape
function mapDjangoRule(r: Record<string, unknown>): TaxRule {
  return {
    id: String(r.rule_id ?? r.id ?? ""),
    year: Number(r.year ?? 2026),
    topic: String(r.topic ?? ""),
    category: String(r.category ?? "") as RuleCategory,
    user_types: (r.user_types as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
    condition: { summary: String(r.condition_summary ?? "") } as TaxRule["condition"],
    result: {
      type: String(r.result_type ?? "amount") as TaxRule["result"]["type"],
      value: r.result_value != null ? Number(r.result_value) : 0,
      unit: String(r.result_unit ?? ""),
      formula: String(r.result_formula ?? ""),
      notes: String(r.notes ?? ""),
    } as TaxRule["result"],
    plain_nl: String(r.plain_nl ?? ""),
    plain_en: String(r.plain_en ?? ""),
    plain_fa: String(r.plain_fa ?? ""),
    ai_prompt_hint: String(r.ai_prompt_hint ?? ""),
    source_url: String(r.source_url ?? ""),
    verification_status: String(r.verification_status ?? "draft") as TaxRule["verification_status"],
    effective_from: String(r.effective_from ?? "2026-01-01"),
    effective_until: r.effective_until ? String(r.effective_until) : null,
    supersedes: r.supersedes ? String(r.supersedes) : null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  } as unknown as TaxRule;
}

// Map frontend TaxRule → Django POST/PUT body
function mapToPayload(rule: Partial<TaxRule>): Record<string, unknown> {
  return {
    rule_id: rule.id,
    year: rule.year,
    topic: rule.topic,
    category: rule.category,
    user_types: rule.user_types,
    tags: rule.tags,
    condition_summary: (rule.condition as { summary?: string })?.summary ?? "",
    result_type: rule.result?.type ?? "amount",
    result_value: rule.result?.value ?? null,
    result_unit: rule.result?.unit ?? "",
    result_formula: rule.result?.formula ?? "",
    notes: rule.result?.notes ?? "",
    plain_nl: rule.plain_nl,
    plain_en: rule.plain_en,
    plain_fa: rule.plain_fa,
    ai_prompt_hint: rule.ai_prompt_hint,
    source_url: rule.source_url,
    verification_status: rule.verification_status,
    effective_from: rule.effective_from,
    effective_until: rule.effective_until ?? null,
    supersedes: rule.supersedes ?? "",
  };
}

// In-memory mock fallback (used when backend is unreachable or unauthenticated)
let mockStore: TaxRule[] = [...ALL_MOCK_RULES];

function delay(ms = 80): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryRealApi<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Log so developers can see the real error — never silently hide API failures
    console.warn("[TaxRules] Backend unreachable, using mock data:", err);
    return fallback();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getRules(filters?: RuleFilters): Promise<TaxRule[]> {
  return tryRealApi(
    async () => {
      const params = new URLSearchParams();
      if (filters?.year && filters.year !== "all") params.set("year", String(filters.year));
      if (filters?.verification_status && filters.verification_status !== "all") params.set("status", filters.verification_status);
      if (filters?.category && filters.category !== "all") params.set("category", filters.category);
      if (filters?.search) params.set("search", filters.search);
      const res = await fetch(`${API_BASE}/tax/rules/?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Backend unavailable");
      const raw = await res.json() as Record<string, unknown>[] | { results: Record<string, unknown>[] };
      const data = Array.isArray(raw) ? raw : (raw as { results: Record<string, unknown>[] }).results ?? [];
      let rules = data.map(mapDjangoRule);
      if (filters?.user_type && filters.user_type !== "all") {
        rules = rules.filter(r => r.user_types.includes(filters.user_type as never));
      }
      return rules;
    },
    async () => {
      await delay();
      let result = [...mockStore];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(r => r.id.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q));
      }
      if (filters?.year && filters.year !== "all") result = result.filter(r => r.year === filters.year);
      if (filters?.user_type && filters.user_type !== "all") result = result.filter(r => r.user_types.includes(filters.user_type as never));
      if (filters?.verification_status && filters.verification_status !== "all") result = result.filter(r => r.verification_status === filters.verification_status);
      if (filters?.category && filters.category !== "all") result = result.filter(r => r.category === filters.category);
      return result.sort((a, b) => a.id.localeCompare(b.id));
    },
  );
}

export async function getRuleById(id: string): Promise<TaxRule | undefined> {
  return tryRealApi(
    async () => {
      const res = await fetch(`${API_BASE}/tax/rules/${encodeURIComponent(id)}/`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Not found");
      return mapDjangoRule(await res.json() as Record<string, unknown>);
    },
    async () => {
      await delay();
      return mockStore.find(r => r.id === id);
    },
  );
}

export async function createRule(rule: Omit<TaxRule, "created_at" | "updated_at">): Promise<TaxRule> {
  return tryRealApi(
    async () => {
      const res = await fetch(`${API_BASE}/tax/rules/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(mapToPayload(rule)),
      });
      if (!res.ok) {
        const err = await res.json() as Record<string, unknown>;
        throw new Error(JSON.stringify(err));
      }
      return mapDjangoRule(await res.json() as Record<string, unknown>);
    },
    async () => {
      await delay();
      const now = new Date().toISOString();
      const newRule: TaxRule = { ...rule, created_at: now, updated_at: now };
      if (mockStore.find(r => r.id === newRule.id)) throw new Error(`Rule ID ${newRule.id} already exists`);
      mockStore = [...mockStore, newRule];
      addAuditEntry(newRule.id, "created", "admin@taxwijs.nl", undefined, newRule, "Created via admin dashboard");
      return newRule;
    },
  );
}

export async function updateRule(id: string, updates: Partial<TaxRule>): Promise<TaxRule> {
  return tryRealApi(
    async () => {
      const res = await fetch(`${API_BASE}/tax/rules/${encodeURIComponent(id)}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(mapToPayload(updates)),
      });
      if (!res.ok) throw new Error("Update failed");
      return mapDjangoRule(await res.json() as Record<string, unknown>);
    },
    async () => {
      await delay();
      const existing = mockStore.find(r => r.id === id);
      if (!existing) throw new Error(`Rule ${id} not found`);
      const before = { ...existing };
      const updated: TaxRule = { ...existing, ...updates, id, updated_at: new Date().toISOString() };
      mockStore = mockStore.map(r => r.id === id ? updated : r);
      addAuditEntry(id, "updated", "admin@taxwijs.nl", before, updates, "Updated via admin dashboard");
      return updated;
    },
  );
}

export async function duplicateRuleToYear(id: string, targetYear: number): Promise<TaxRule> {
  await delay();
  const source = mockStore.find(r => r.id === id) ?? await getRuleById(id);
  if (!source) throw new Error(`Rule ${id} not found`);

  const idParts = id.split("-");
  idParts[1] = String(targetYear);
  const existingInYear = mockStore.filter(r => r.id.startsWith(`${idParts[0]}-${targetYear}-`));
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

  return createRule(duplicate);
}

export async function deleteRule(id: string): Promise<void> {
  return tryRealApi(
    async () => {
      const res = await fetch(`${API_BASE}/tax/rules/${encodeURIComponent(id)}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    async () => {
      await delay();
      const existing = mockStore.find(r => r.id === id);
      if (!existing) throw new Error(`Rule ${id} not found`);
      mockStore = mockStore.filter(r => r.id !== id);
      addAuditEntry(id, "deleted", "admin@taxwijs.nl", existing, undefined, "Deleted via admin dashboard");
    },
  );
}

export async function getAdminStats(): Promise<AdminStats> {
  return tryRealApi(
    async () => {
      const res = await fetch(`${API_BASE}/tax/admin/stats/`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Stats unavailable");
      const data = await res.json() as Record<string, unknown>;
      // Map Django response to frontend AdminStats shape
      const byYear: Record<number, number> = {};
      const byCategory: Partial<Record<RuleCategory, number>> = {};
      const yearRows = data.rules_by_year as Array<{ year: number; count: number }>;
      const catRows = data.rules_by_category as Array<{ category: string; count: number }>;
      for (const r of yearRows ?? []) byYear[r.year] = r.count;
      for (const r of catRows ?? []) byCategory[r.category as RuleCategory] = r.count;
      return {
        total: Number(data.total_rules ?? 0),
        verified: Number(data.verified_rules ?? 0),
        draft: Number(data.draft_rules ?? 0),
        pending_review: Number(data.pending_rules ?? 0),
        expired: 0,
        expiring_soon: 0,
        by_year: byYear,
        by_category: byCategory,
      };
    },
    async () => {
      await delay();
      const today = new Date().toISOString().split("T")[0];
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 60);
      const soon = soonDate.toISOString().split("T")[0];
      const byYear: Record<number, number> = {};
      const byCategory: Partial<Record<RuleCategory, number>> = {};
      for (const r of mockStore) {
        byYear[r.year] = (byYear[r.year] ?? 0) + 1;
        byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      }
      return {
        total: mockStore.length,
        verified: mockStore.filter(r => r.verification_status === "verified").length,
        draft: mockStore.filter(r => r.verification_status === "draft").length,
        pending_review: mockStore.filter(r => r.verification_status === "pending_review").length,
        expired: mockStore.filter(r => r.effective_until !== null && r.effective_until < today).length,
        expiring_soon: mockStore.filter(r => r.effective_until !== null && r.effective_until >= today && r.effective_until <= soon).length,
        by_year: byYear,
        by_category: byCategory,
      };
    },
  );
}
