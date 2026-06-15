import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import {
  fetchClientTasks, updateClientTask,
  fetchClientEngagement, uploadClientDocument,
} from "../../api/portal/client";
import type { TaxEngagement } from "../../api/portal/types";

interface Task {
  id: string;
  raw_id: number;
  type: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  status: string;
  priority: string;
  stable_key?: string;
  meta_value?: string;
}

// Stable keys whose "Take action" shows an inline input (text / date / number)
const INLINE_INFO_KEYS = new Set([
  // ZZP identity + info
  "zzp_kvk", "zzp_btw", "zzp_start_date", "zzp_revenue", "zzp_wet_dba_clients",
  // Employee identity
  "emp_bsn", "emp_personal_details",
  // Expat identity
  "exp_start_date", "exp_prev_country",
  // DGA identity + compliance
  "dga_bv_details", "dga_shareholding", "dga_salary", "dga_gebruikelijk_loon",
  // Other
  "oth_employment_status",
]);

// Inline inputs that render as <input type="date">
const DATE_KEYS = new Set(["zzp_start_date", "exp_start_date"]);

// Inline inputs that render as <input type="number">
const NUMBER_KEYS = new Set(["zzp_revenue", "dga_salary", "dga_shareholding"]);

function isInfoTask(task: Task): boolean {
  if (INLINE_INFO_KEYS.has(task.stable_key ?? "")) return true;
  const lower = (task.title + " " + task.description).toLowerCase();
  return lower.includes("kvk") || lower.includes("btw-nummer") || lower.includes("btw nummer") || lower.includes("vat number");
}

// Document-upload categories — includes vat (BTW returns are submitted documents)
const DOC_CATEGORIES = new Set([
  "identity","income","expense","bank","property","box3","box2",
  "business","payroll","household","other","vat",
]);

// Specific stable keys that force upload modal even for non-DOC_CATEGORIES (e.g. compliance)
const DOC_STABLE_KEYS = new Set(["zzp_wet_dba_contracts"]);

function getInlineType(task: Task): "text" | "date" | "number" {
  const key = task.stable_key ?? "";
  if (DATE_KEYS.has(key)) return "date";
  if (NUMBER_KEYS.has(key)) return "number";
  return "text";
}

function formatMetaValue(task: Task, lang: Lang): string {
  const val = task.meta_value ?? "";
  if (!val) return "";
  if (DATE_KEYS.has(task.stable_key ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    try {
      const loc = lang === "nl" ? "nl-NL" : lang === "fa" ? "fa-IR" : "en-GB";
      return new Date(val + "T00:00:00").toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
    } catch { return val; }
  }
  if (NUMBER_KEYS.has(task.stable_key ?? "") && !isNaN(Number(val))) {
    return `€ ${Number(val).toLocaleString("nl-NL")}`;
  }
  return val;
}

type Lang = "nl" | "en" | "fa";

const STATUS_COLOR: Record<string, string> = {
  todo:           "var(--text-3)",
  waiting_client: "var(--warn-text)",
  uploaded:       "var(--ok-text)",
  needs_review:   "var(--warn-text)",
  accepted:       "var(--ok-text)",
  rejected:       "var(--danger-text)",
  waived:         "var(--text-4)",
};
const STATUS_BG: Record<string, string> = {
  todo:           "var(--bg-3)",
  waiting_client: "var(--warn-subtle)",
  uploaded:       "var(--ok-subtle)",
  needs_review:   "var(--warn-subtle)",
  accepted:       "var(--ok-subtle)",
  rejected:       "var(--danger-subtle)",
  waived:         "var(--bg-3)",
};

/**
 * Category → route the "Take Action" button redirects to.
 * Categories come from accountant_checklists.py — must match exactly.
 * For /chat routes, handleTakeAction also passes the task title as the question.
 */
const CATEGORY_ROUTE: Record<string, string> = {
  // Upload a document
  identity:   "/client/documents",
  income:     "/client/documents",
  expense:    "/client/documents",   // NB: singular — backend uses "expense" not "expenses"
  bank:       "/client/documents",
  property:   "/client/documents",   // mortgage statements, WOZ
  box3:       "/client/documents",   // bank/savings/investment statements
  box2:       "/client/documents",   // dividend/shareholding docs (DGA)
  business:   "/client/documents",   // BV annual accounts, KVK extract
  payroll:    "/client/documents",   // loonheffingen declarations
  household:  "/client/documents",   // partner/family documents

  // Use the deduction checker
  deductions: "/deduction-checker",

  // Need AI explanation — send with task question pre-filled
  vat:        "/chat",
  compliance: "/chat",   // Wet DBA, urencriterium, M-form (see title-based override below)
  pension:    "/chat",
  toeslagen:  "/chat",

  other:      "/client/documents",
};

/**
 * Title-based override — some compliance tasks map to ZZP Workspace instead of chat.
 * Checks task title and description for keywords.
 */
function resolveRoute(task: Task): string {
  const titleLower = (task.title + " " + (task.description ?? "")).toLowerCase();

  // Hours / time tracking → ZZP Workspace (Hours tab)
  if (titleLower.includes("hour") || titleLower.includes("uren") || titleLower.includes("time") || titleLower.includes("urencriterium")) {
    return "/zzp-workspace";
  }
  // Mileage → ZZP Workspace (Mileage tab)
  if (titleLower.includes("mileage") || titleLower.includes("kilometer") || titleLower.includes("km-log") || titleLower.includes("travel costs")) {
    return "/zzp-workspace";
  }
  // Revenue / invoices → ZZP Workspace (Revenue tab)
  if (
    (titleLower.includes("revenue") || titleLower.includes("invoice") || titleLower.includes("omzet") || titleLower.includes("factuur")) &&
    task.category === "income"
  ) {
    return "/zzp-workspace";
  }
  // Expense entries → ZZP Workspace (Expenses tab)
  if (
    (titleLower.includes("purchase invoice") || titleLower.includes("receipt") || titleLower.includes("kosten") || titleLower.includes("expense")) &&
    task.category === "expense"
  ) {
    return "/zzp-workspace";
  }

  return CATEGORY_ROUTE[task.category] ?? "/client/documents";
}

const TX: Record<Lang, Record<string, string>> = {
  en: {
    title:          "My tasks",
    back:           "← Back",
    done_section:   "Done",
    required:       "Required",
    all_done:       "All tasks done!",
    all_done_sub:   "Your file is ready — your accountant will be in touch.",
    empty:          "No tasks found.",
    loading:        "Loading...",
    error:          "Could not load tasks.",
    ask_ai:         "Ask AI",
    take_action:    "Take action →",
    mark_done:      "Mark as done",
    marking:        "Saving…",
    undo:           "Undo",
    completed_of:   "completed of",
    save:           "Save",
    cancel:         "Cancel",
    saving:         "Saving…",
    upload_doc:     "Upload document",
    choose_file:    "Choose file…",
    uploading:      "Uploading…",
    upload_title_lbl: "Title (optional)",
    upload_err:     "Upload failed",
    enter_value:    "Enter value…",
    enter_number:   "Enter amount (€)…",
    status_todo:           "To do",
    status_waiting_client: "Waiting for client",
    status_uploaded:       "Uploaded",
    status_needs_review:   "Needs review",
    status_accepted:       "Accepted",
    status_rejected:       "Rejected",
    status_waived:         "Waived",
    cat_identity:   "Identity",
    cat_income:     "Income",
    cat_expenses:   "Expenses",
    cat_deductions: "Deductions",
    cat_bank:       "Bank",
    cat_mortgage:   "Mortgage",
    cat_pension:    "Pension",
    cat_other:      "Other",
    pri_high:       "High",
    pri_medium:     "Medium",
    pri_low:        "Low",
  },
  nl: {
    title:          "Mijn taken",
    back:           "← Terug",
    done_section:   "Voltooid",
    required:       "Vereist",
    all_done:       "Alle taken voltooid!",
    all_done_sub:   "Uw dossier is klaar — uw accountant neemt contact op.",
    empty:          "Geen taken gevonden.",
    loading:        "Laden...",
    error:          "Taken konden niet worden geladen.",
    ask_ai:         "Vraag AI",
    take_action:    "Actie ondernemen →",
    mark_done:      "Als gedaan markeren",
    marking:        "Opslaan…",
    undo:           "Ongedaan maken",
    completed_of:   "voltooid van",
    save:           "Opslaan",
    cancel:         "Annuleren",
    saving:         "Opslaan…",
    upload_doc:     "Document uploaden",
    choose_file:    "Bestand kiezen…",
    uploading:      "Bezig…",
    upload_title_lbl: "Titel (optioneel)",
    upload_err:     "Upload mislukt",
    enter_value:    "Waarde invoeren…",
    enter_number:   "Bedrag invoeren (€)…",
    status_todo:           "Te doen",
    status_waiting_client: "Wacht op klant",
    status_uploaded:       "Geüpload",
    status_needs_review:   "Beoordeling nodig",
    status_accepted:       "Geaccepteerd",
    status_rejected:       "Afgewezen",
    status_waived:         "Vrijgesteld",
    cat_identity:   "Identiteit",
    cat_income:     "Inkomsten",
    cat_expenses:   "Kosten",
    cat_deductions: "Aftrekposten",
    cat_bank:       "Bank",
    cat_mortgage:   "Hypotheek",
    cat_pension:    "Pensioen",
    cat_other:      "Overig",
    pri_high:       "Hoog",
    pri_medium:     "Gemiddeld",
    pri_low:        "Laag",
  },
  fa: {
    title:          "وظایف من",
    back:           "← بازگشت",
    done_section:   "انجام شده",
    required:       "ضروری",
    all_done:       "تمام وظایف انجام شد!",
    all_done_sub:   "پرونده شما آماده است — حسابدار شما تماس خواهد گرفت.",
    empty:          "وظیفه‌ای یافت نشد.",
    loading:        "در حال بارگذاری...",
    error:          "بارگذاری وظایف ناموفق بود.",
    ask_ai:         "پرسش از AI",
    take_action:    "اقدام کنید →",
    mark_done:      "علامت‌گذاری به عنوان انجام شده",
    marking:        "ذخیره‌سازی…",
    undo:           "بازگشت",
    completed_of:   "تکمیل از",
    save:           "ذخیره",
    cancel:         "لغو",
    saving:         "ذخیره‌سازی…",
    upload_doc:     "بارگذاری سند",
    choose_file:    "انتخاب فایل…",
    uploading:      "در حال بارگذاری…",
    upload_title_lbl: "عنوان (اختیاری)",
    upload_err:     "بارگذاری ناموفق",
    enter_value:    "مقدار را وارد کنید…",
    enter_number:   "مبلغ را وارد کنید (€)…",
    status_todo:           "در انتظار",
    status_waiting_client: "منتظر مشتری",
    status_uploaded:       "بارگذاری شده",
    status_needs_review:   "نیاز به بررسی",
    status_accepted:       "پذیرفته شده",
    status_rejected:       "رد شده",
    status_waived:         "معاف شده",
    cat_identity:   "هویت",
    cat_income:     "درآمد",
    cat_expenses:   "هزینه‌ها",
    cat_deductions: "کسورات",
    cat_bank:       "بانک",
    cat_mortgage:   "رهن",
    cat_pension:    "بازنشستگی",
    cat_other:      "سایر",
    pri_high:       "بالا",
    pri_medium:     "متوسط",
    pri_low:        "پایین",
  },
};

function statusLabel(status: string, tx: Record<string, string>): string {
  return tx[`status_${status}`] ?? status;
}
function categoryLabel(cat: string, tx: Record<string, string>): string {
  return tx[`cat_${cat}`] ?? cat;
}

function SkeletonTask() {
  return (
    <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-2)" }}>
      <div className="skel" style={{ height: 14, width: "60%", marginBottom: 10 }} />
      <div className="skel" style={{ height: 10, width: "80%", marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="skel" style={{ height: 20, width: 60, borderRadius: 999 }} />
        <div className="skel" style={{ height: 20, width: 80, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function ClientTasksPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as Lang;
  const tx = TX[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [readiness, setReadiness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);

  // Inline text-input state (for KVK, BTW-number type tasks)
  const [inlineActiveId, setInlineActiveId] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);

  // Upload modal state (for document-category tasks)
  const [uploadTaskId, setUploadTaskId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = setInterval(() => void load(true), 15_000);
    return () => clearInterval(id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [result, eng] = await Promise.all([
        fetchClientTasks(),
        fetchClientEngagement(),
      ]);
      const enriched = ((result.tasks as Task[]) || []).map(t => ({
        ...t,
        raw_id: parseInt((t.id as string).replace("chk_", ""), 10),
      }));
      setTasks(enriched);
      setTotal(result.total);
      setCompleted(result.completed);
      setReadiness(result.readiness_score);
      setEngagement(eng);
      setLastUpdated(new Date());
      if (!silent) setError("");
    } catch {
      if (!silent) setError(tx.error);
    }
    if (!silent) setLoading(false);
  }

  function handleAskAI(task: Task) {
    // Prepend language instruction so the AI responds in the user's selected language
    const langPrefix =
      lang === "fa" ? "لطفاً به فارسی پاسخ دهید.\n\n" :
      lang === "nl" ? "Antwoord alstublieft in het Nederlands.\n\n" :
      "";
    const question = `${langPrefix}${task.title}${task.description ? `:\n${task.description}` : ""}`;
    navigate("/chat", { state: { question } });
  }

  async function handleMarkDone(task: Task) {
    const newStatus = task.status === "uploaded" ? "todo" : "uploaded";
    setMarkingId(task.raw_id);
    try {
      await updateClientTask(task.raw_id, { status: newStatus });
      setTasks(prev => prev.map(t =>
        t.raw_id === task.raw_id ? { ...t, status: newStatus } : t
      ));
      // Optimistically update counter
      if (newStatus === "uploaded") {
        setCompleted(c => c + 1);
      } else {
        setCompleted(c => Math.max(0, c - 1));
      }
    } catch {
      /* fail silently — server state will reconcile on next poll */
    }
    setMarkingId(null);
  }

  function handleTakeAction(task: Task) {
    // Info tasks (KVK number, BTW number, etc.) — show inline text field
    if (isInfoTask(task)) {
      setInlineActiveId(task.raw_id);
      setInlineValue(task.meta_value ?? "");
      return;
    }
    // Document-upload categories or specific doc stable_keys — show upload modal on this page
    if (DOC_CATEGORIES.has(task.category) || DOC_STABLE_KEYS.has(task.stable_key ?? "")) {
      setUploadTaskId(task.raw_id);
      setUploadTitle(task.title);
      setUploadError("");
      setUploadFile(null);
      setUploadProgress(null);
      return;
    }
    // Everything else (chat, ZZP workspace, deductions) — navigate
    const route = resolveRoute(task);
    if (route === "/chat") {
      const langPrefix =
        lang === "fa" ? "لطفاً به فارسی پاسخ دهید.\n\n" :
        lang === "nl" ? "Antwoord alstublieft in het Nederlands.\n\n" :
        "";
      const question = `${langPrefix}${task.title}${task.description ? `:\n${task.description}` : ""}`;
      navigate(route, { state: { question } });
    } else {
      navigate(route);
    }
  }

  async function handleSaveInline(task: Task) {
    if (!inlineValue.trim()) return;
    setInlineSaving(true);
    try {
      await updateClientTask(task.raw_id, { status: "uploaded", meta_value: inlineValue.trim() });
      setTasks(prev => prev.map(t =>
        t.raw_id === task.raw_id ? { ...t, status: "uploaded", meta_value: inlineValue.trim() } : t
      ));
      setCompleted(c => task.status !== "uploaded" ? c + 1 : c);
      setInlineActiveId(null);
      setInlineValue("");
    } catch { /* fail silently */ }
    setInlineSaving(false);
  }

  async function handleUploadDoc() {
    if (!uploadFile || !engagement || uploadTaskId === null) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");
    try {
      await uploadClientDocument(
        engagement.id,
        engagement.client_profile,
        uploadFile,
        uploadTitle,
        "",
        undefined,
        pct => setUploadProgress(pct),
      );
      // Mark the task as uploaded too
      await updateClientTask(uploadTaskId, { status: "uploaded" });
      setTasks(prev => prev.map(t =>
        t.raw_id === uploadTaskId ? { ...t, status: "uploaded" } : t
      ));
      setCompleted(c => {
        const task = tasks.find(t => t.raw_id === uploadTaskId);
        return task && task.status !== "uploaded" ? c + 1 : c;
      });
      setUploadTaskId(null);
      setUploadFile(null);
      setUploadTitle("");
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : tx.upload_err);
      setUploadProgress(null);
    }
    setUploading(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8) var(--sp-6)", maxWidth: 740, margin: "0 auto", width: "100%" }}>
      <div className="skel" style={{ height: 14, width: 80, marginBottom: 20 }} />
      <div className="skel" style={{ height: 22, width: 180, marginBottom: 24 }} />
      <div className="skel" style={{ height: 6, marginBottom: 20, borderRadius: 3 }} />
      {[1,2,3].map(i => <SkeletonTask key={i} />)}
    </main>
  );

  if (error && tasks.length === 0) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center" }}>
      <p style={{ color: "var(--danger-text)", fontWeight: 600 }}>{error}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => void load()} style={{ marginTop: 8 }}>↻ Retry</button>
    </main>
  );

  const openTasks = tasks.filter(t => !["accepted", "waived"].includes(t.status));
  const doneTasks = tasks.filter(t => ["accepted", "waived"].includes(t.status));

  return (
    <main style={{ background: "var(--bg)", flex: 1 }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        <Link to="/client" style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", textDecoration: "none", fontWeight: 600 }}>{tx.back}</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "var(--sp-3) 0 var(--sp-4)" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>{tx.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", fontWeight: 600 }}>{completed} {tx.completed_of} {total}</span>
            {lastUpdated && <span style={{ fontSize: 10, color: "var(--text-4)" }}>{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => void load(true)} title="Refresh" style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", fontSize: 14, width: 30, height: 30, display: "grid", placeItems: "center" }}>↻</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--border)", marginBottom: "var(--sp-5)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readiness}%`, background: readiness >= 85 ? "var(--ok)" : "var(--warn)", borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>

        {tasks.length === 0 && (
          <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--text-3)" }}>{tx.empty}</div>
        )}

        {/* Open tasks */}
        {openTasks.length > 0 && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            {openTasks.map(task => {
              const isDone = task.status === "uploaded";
              const isMarking = markingId === task.raw_id;
              return (
                <div key={task.id} className="card" style={{
                  padding: "var(--sp-4)", marginBottom: "var(--sp-3)",
                  borderInlineStart: `3px solid ${task.required ? "var(--danger)" : "var(--border-2)"}`,
                  opacity: isDone ? 0.75 : 1,
                  transition: "opacity 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)", marginBottom: 4 }}>
                        {task.required && <span style={{ color: "var(--danger)", marginInlineEnd: 4 }}>*</span>}
                        {isDone ? <s style={{ opacity: 0.7 }}>{task.title}</s> : task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: 8, fontWeight: 500 }}>{task.description}</div>
                      )}
                      <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", alignItems: "center" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)", fontWeight: 700 }}>{categoryLabel(task.category, tx)}</span>
                        {task.required && (
                          <span className="pill pill-danger" style={{ fontSize: "var(--text-2xs)" }}>{tx.required}</span>
                        )}
                        <span style={{
                          fontSize: "var(--text-xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          color: STATUS_COLOR[task.status] ?? "var(--text-3)",
                          background: STATUS_BG[task.status] ?? "var(--bg-3)",
                        }}>
                          {statusLabel(task.status, tx)}
                        </span>
                      </div>

                      {/* Saved meta_value display */}
                      {task.meta_value && (
                        <div style={{ marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", color: "var(--ok-text)", fontWeight: 600 }}>
                          ✓ {formatMetaValue(task, lang)}
                        </div>
                      )}

                      {/* Inline input form (info tasks: KVK, BTW, dates, numbers, etc.) */}
                      {inlineActiveId === task.raw_id && (() => {
                        const inputType = getInlineType(task);
                        return (
                        <div style={{ marginTop: "var(--sp-3)", display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            autoFocus
                            type={inputType}
                            value={inlineValue}
                            onChange={e => setInlineValue(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") void handleSaveInline(task); if (e.key === "Escape") setInlineActiveId(null); }}
                            placeholder={inputType === "number" ? tx.enter_number : inputType === "date" ? "" : tx.enter_value}
                            min={inputType === "number" ? "0" : undefined}
                            style={{
                              flex: 1, minWidth: 160, padding: "6px 10px",
                              border: "1.5px solid var(--blue)", borderRadius: "var(--r)",
                              background: "var(--bg)", color: "var(--text)",
                              fontSize: "var(--text-sm)", outline: "none",
                            }}
                          />
                          <button
                            className="btn btn-accent btn-sm"
                            style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}
                            disabled={inlineSaving || !inlineValue.trim()}
                            onClick={() => void handleSaveInline(task)}
                          >
                            {inlineSaving ? tx.saving : tx.save}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: "var(--text-xs)" }}
                            onClick={() => setInlineActiveId(null)}
                          >
                            {tx.cancel}
                          </button>
                        </div>
                        );
                      })()}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", alignItems: "flex-end", flexShrink: 0 }}>
                      {/* Mark as done / undo */}
                      <button
                        className={isDone ? "btn btn-ghost btn-sm" : "btn btn-accent btn-sm"}
                        style={{ fontSize: "var(--text-xs)", minWidth: 110, fontWeight: 700 }}
                        disabled={isMarking}
                        onClick={() => handleMarkDone(task)}
                      >
                        {isMarking ? tx.marking : isDone ? `↩ ${tx.undo}` : `✓ ${tx.mark_done}`}
                      </button>

                      {/* Take action — inline input / upload modal / navigate */}
                      {!isDone && inlineActiveId !== task.raw_id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: "var(--text-xs)", border: "1px solid var(--blue-border)", color: "var(--blue-text)", fontWeight: 700 }}
                          onClick={() => handleTakeAction(task)}
                        >
                          {tx.take_action}
                        </button>
                      )}

                      {/* Ask AI */}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}
                        onClick={() => handleAskAI(task)}
                      >
                        {tx.ask_ai}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--sp-3)" }}>
              {tx.done_section} ({doneTasks.length})
            </div>
            {doneTasks.map(task => (
              <div key={task.id} style={{
                padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-1)",
                opacity: 0.55, display: "flex", justifyContent: "space-between",
                borderBottom: "1px solid var(--border)", fontSize: "var(--text-sm)",
              }}>
                <span style={{ textDecoration: "line-through", color: "var(--text-3)", fontWeight: 600 }}>{task.title}</span>
                <span style={{ color: "var(--ok-text)", fontSize: "var(--text-xs)", fontWeight: 700 }}>✓ {statusLabel(task.status, tx)}</span>
              </div>
            ))}
          </div>
        )}

        {/* All done celebration */}
        {openTasks.length === 0 && tasks.length > 0 && (
          <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", background: "var(--ok-subtle)", border: "1px solid var(--ok-border)", marginTop: "var(--sp-5)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ok-text)", marginBottom: 6 }}>{tx.all_done}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", fontWeight: 500 }}>{tx.all_done_sub}</div>
          </div>
        )}
      </div>

      {/* Hidden file input for upload modal */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setUploadFile(f); if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, "")); }
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      {/* Document upload modal */}
      {uploadTaskId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--sp-4)",
        }}
          onClick={e => { if (e.target === e.currentTarget) { setUploadTaskId(null); setUploadFile(null); } }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "var(--sp-6)" }}>
            <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", marginBottom: "var(--sp-4)" }}>
              {tx.upload_doc}
            </div>
            {/* Task title context */}
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-4)", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r)", fontWeight: 600 }}>
              {tasks.find(t => t.raw_id === uploadTaskId)?.title}
            </div>

            {/* Title field */}
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>
                {tx.upload_title_lbl}
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", boxSizing: "border-box",
                  border: "1.5px solid var(--border)", borderRadius: "var(--r)",
                  background: "var(--bg)", color: "var(--text)", fontSize: "var(--text-sm)",
                }}
              />
            </div>

            {/* File picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-2)", borderRadius: "var(--r-lg)",
                padding: "var(--sp-5)", textAlign: "center", cursor: "pointer",
                background: uploadFile ? "var(--ok-subtle)" : "var(--bg-2)",
                marginBottom: "var(--sp-4)",
                transition: "background 0.15s",
              }}
            >
              {uploadFile ? (
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ok-text)" }}>
                  ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                </div>
              ) : (
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", fontWeight: 600 }}>
                  {tx.choose_file}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploadProgress !== null && (
              <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: "var(--sp-3)" }}>
                <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--blue)", transition: "width 0.3s" }} />
              </div>
            )}

            {uploadError && (
              <div style={{ color: "var(--danger-text)", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--sp-3)" }}>
                {uploadError}
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--sp-2)", justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setUploadTaskId(null); setUploadFile(null); setUploadError(""); }}
                disabled={uploading}
              >
                {tx.cancel}
              </button>
              <button
                className="btn btn-accent btn-sm"
                style={{ fontWeight: 700 }}
                disabled={uploading || !uploadFile}
                onClick={() => void handleUploadDoc()}
              >
                {uploading ? `${tx.uploading} ${uploadProgress ?? 0}%` : tx.upload_doc}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
