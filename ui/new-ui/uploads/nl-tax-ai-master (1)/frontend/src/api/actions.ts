import { authHeader } from "./client";

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

export interface ServerItemStates {
  alerts:  Record<string, { state: ActionState; snoozed_until: string | null }>;
  actions: Record<string, { state: ActionState; snoozed_until: string | null }>;
}

const STORAGE_KEY = "taxwijs_action_states";
const SNOOZE_KEY  = "taxwijs_snoozed_until"; // { [id]: ISO date string }

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

// ── Backend state sync (authenticated users only) ────────────────────────────

/** Fetch all alert/action states from the server and merge into localStorage. */
export async function fetchServerStates(): Promise<ServerItemStates | null> {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const res = await fetch("/api/users/item-states/", {
      headers: { ...authHeader() },
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerItemStates;
  } catch {
    return null;
  }
}

/** Persist a single state change to the server (fire-and-forget for UX speed). */
export async function persistStateToServer(
  item_type: "alert" | "action",
  item_id: string,
  state: ActionState,
  snoozed_until?: string | null,
): Promise<void> {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  try {
    await fetch("/api/users/item-states/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ item_type, item_id, state, snoozed_until: snoozed_until ?? null }),
    });
  } catch {
    // Non-critical: localStorage already updated; server sync is best-effort
  }
}

// ── localStorage helpers ──────────────────────────────────────────────────────

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
  map[id] = until.toISOString().slice(0, 10);
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

/** Returns true if the item is currently snoozed. */
export function isSnoozed(id: string): boolean {
  const map = loadSnoozeMap();
  const until = map[id];
  if (!until) return false;
  return new Date(until) > new Date();
}

/** Remove an existing snooze. */
export function unsnooze(id: string): void {
  const map = loadSnoozeMap();
  delete map[id];
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}
