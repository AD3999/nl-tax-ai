export interface TaxAction {
  id: string;
  category: "filing" | "preparation" | "review" | "optimization" | "compliance";
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  action_label: string;
  action_url: string;
  due_date: string | null;
}

export type ActionState = "open" | "done" | "dismissed" | "snoozed";

const STORAGE_KEY = "taxwijs_action_states";
const SNOOZE_KEY  = "taxwijs_snoozed_until"; // { [id]: ISO date string }

function authHeader(): Record<string, string> {
  const t = localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function fetchActions(
  profile: Record<string, unknown> | null,
  lang: string,
): Promise<TaxAction[]> {
  if (!profile) return [];
  try {
    const res = await fetch("/api/users/actions/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ profile, lang }),
    });
    if (!res.ok) return [];
    return (await res.json()) as TaxAction[];
  } catch {
    return [];
  }
}

export function loadActionStates(): Record<string, ActionState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, ActionState>;
  } catch {
    return {};
  }
}

export function saveActionState(id: string, state: ActionState): void {
  const current = loadActionStates();
  current[id] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

// ── Snooze helpers (shared by alerts and actions) ────────────────────────────

export function loadSnoozeMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? "{}") as Record<string, string>; }
  catch { return {}; }
}

/** Snooze an item until `daysFromNow` days from today. */
export function snoozeItem(id: string, daysFromNow: number): void {
  const until = new Date();
  until.setDate(until.getDate() + daysFromNow);
  const map = loadSnoozeMap();
  map[id] = until.toISOString().slice(0, 10); // YYYY-MM-DD
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

/** Returns true if the item is currently snoozed (snooze date is in the future). */
export function isSnoozed(id: string): boolean {
  const map = loadSnoozeMap();
  const until = map[id];
  if (!until) return false;
  return new Date(until) > new Date();
}

/** Remove an existing snooze (unsnoozed). */
export function unsnooze(id: string): void {
  const map = loadSnoozeMap();
  delete map[id];
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}
