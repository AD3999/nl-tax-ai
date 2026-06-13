import { authHeader } from "./client";

export interface YearSnapshot {
  id: number;
  tax_year: number;
  source: string;
  is_final: boolean;
  notes: string;
  total_tax_due: number | null;
  effective_rate: number | null;
  monthly_reserve: number | null;
  user_type: string | null;
  created_at: string;
}

export async function fetchSnapshots(): Promise<YearSnapshot[]> {
  const res = await fetch("/api/users/snapshots/", {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function saveSnapshot(params: {
  tax_year?: number;
  is_final?: boolean;
  notes?: string;
}): Promise<{ id: number; tax_year: number; created: boolean; total_tax_due: number | null }> {
  const res = await fetch("/api/users/snapshots/", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
