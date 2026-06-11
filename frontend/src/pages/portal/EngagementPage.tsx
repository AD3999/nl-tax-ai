import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import {
  fetchEngagement, fetchChecklist, fetchDocuments,
  fetchIncome, fetchExpenses, fetchActions, generateActions, fetchRisks,
  fetchAudit, updateChecklistItem, reviewDocument, sendReminder,
  recalculateReadiness, updateAction, updateIncome, updateExpense,
  uploadDocument,
} from "../../api/portal/client";
import type {
  TaxEngagement, ChecklistItem, ClientDocument,
  ExtractedIncome, ExtractedExpense, AccountantAction, ReadinessResult, AuditLog,
} from "../../api/portal/types";

type Tab = "overview" | "checklist" | "documents" | "income" | "expenses" | "risks" | "audit";
type Lang = "nl" | "en" | "fa";

const TX: Record<Lang, Record<string, string>> = {
  en: {
    portal: "Accountant Portal",
    back: "← Back",
    recalculate: "Recalculate",
    send_reminder: "Send reminder",
    generate_actions: "Generate actions",
    generating: "...",
    tab_overview: "Overview",
    tab_checklist: "Checklist",
    tab_documents: "Documents",
    tab_income: "Income",
    tab_expenses: "Expenses",
    tab_risks: "Risks & Deductions",
    tab_audit: "Audit log",
    readiness: "Readiness",
    status: "Status",
    risk: "Risk",
    missing_items: "missing items",
    next_actions: "Next actions",
    open: "open",
    no_actions: "No actions — click \"Generate actions\" to analyse the engagement",
    done: "✓ Done",
    dismiss: "Dismiss",
    no_checklist: "No checklist items",
    no_documents: "No documents uploaded",
    upload_doc: "Upload document",
    uploading: "Uploading...",
    approve: "Approve",
    reject: "Reject",
    view: "View",
    confidence: "Confidence",
    extracted: "Extracted",
    no_income: "No extracted income rows",
    no_expenses: "No extracted expense rows",
    deductions: "Deduction opportunities",
    risk_warnings: "Risk warnings",
    no_risks: "No risks detected",
    loading_risks: "Loading...",
    no_audit: "No audit events",
    blocking: "Blocking",
    none: "None",
    reminder_preview: "Reminder preview",
    reminder_missing: "missing",
    status_todo: "To do",
    status_waiting_client: "Waiting for client",
    status_uploaded: "Uploaded",
    status_needs_review: "Needs review",
    status_accepted: "Accepted",
    status_rejected: "Rejected",
    status_waived: "Waived",
    col_type: "Type",
    col_description: "Description",
    col_gross: "Gross",
    col_tax_withheld: "Tax withheld",
    col_status: "Status",
    col_category: "Category",
    col_supplier: "Supplier",
    col_vat: "VAT",
    source: "Source ↗",
    updated: "updated",
    checklist_updated: "Checklist item updated",
    checklist_error: "Failed to update checklist item",
    action_updated: "Action updated",
    action_error: "Failed to update action",
    doc_updated: "Document review updated",
    doc_error: "Failed to update document",
    income_updated: "Income record updated",
    income_error: "Failed to update income",
    expense_updated: "Expense record updated",
    expense_error: "Failed to update expense",
  },
  nl: {
    portal: "Accountant Portal",
    back: "← Terug",
    recalculate: "Herberekenen",
    send_reminder: "Herinnering sturen",
    generate_actions: "Acties genereren",
    generating: "...",
    tab_overview: "Overzicht",
    tab_checklist: "Checklist",
    tab_documents: "Documenten",
    tab_income: "Inkomsten",
    tab_expenses: "Kosten",
    tab_risks: "Risico's & aftrekposten",
    tab_audit: "Auditlog",
    readiness: "Gereedheid",
    status: "Status",
    risk: "Risico",
    missing_items: "ontbrekende items",
    next_actions: "Volgende acties",
    open: "open",
    no_actions: "Geen acties — klik op \"Acties genereren\" om het dossier te analyseren",
    done: "✓ Klaar",
    dismiss: "Verwijderen",
    no_checklist: "Geen checklistitems",
    no_documents: "Geen documenten geüpload",
    upload_doc: "Document uploaden",
    uploading: "Bezig...",
    approve: "Accepteren",
    reject: "Afwijzen",
    view: "Bekijken",
    confidence: "Betrouwbaarheid",
    extracted: "Geëxtraheerd",
    no_income: "Geen geëxtraheerde inkomstenrijen",
    no_expenses: "Geen geëxtraheerde kostenrijen",
    deductions: "Aftrekmogelijkheden",
    risk_warnings: "Risicowaarschuwingen",
    no_risks: "Geen risico's gedetecteerd",
    loading_risks: "Laden...",
    no_audit: "Geen auditgebeurtenissen",
    blocking: "Blokkerend",
    none: "Geen",
    reminder_preview: "Herinneringsvoorbeeld",
    reminder_missing: "ontbreekt",
    status_todo: "Te doen",
    status_waiting_client: "Wacht op klant",
    status_uploaded: "Geüpload",
    status_needs_review: "Beoordeling nodig",
    status_accepted: "Geaccepteerd",
    status_rejected: "Afgewezen",
    status_waived: "Vrijgesteld",
    col_type: "Type",
    col_description: "Omschrijving",
    col_gross: "Bruto",
    col_tax_withheld: "Ingehouden belasting",
    col_status: "Status",
    col_category: "Categorie",
    col_supplier: "Leverancier",
    col_vat: "BTW",
    source: "Bron ↗",
    updated: "bijgewerkt",
    checklist_updated: "Checklistitem bijgewerkt",
    checklist_error: "Bijwerken mislukt",
    action_updated: "Actie bijgewerkt",
    action_error: "Actie bijwerken mislukt",
    doc_updated: "Documentbeoordeling bijgewerkt",
    doc_error: "Documentbeoordeling mislukt",
    income_updated: "Inkomstenrecord bijgewerkt",
    income_error: "Inkomstenrecord bijwerken mislukt",
    expense_updated: "Kostenrecord bijgewerkt",
    expense_error: "Kostenrecord bijwerken mislukt",
  },
  fa: {
    portal: "پورتال حسابدار",
    back: "← بازگشت",
    recalculate: "محاسبه مجدد",
    send_reminder: "ارسال یادآوری",
    generate_actions: "ایجاد اقدامات",
    generating: "...",
    tab_overview: "خلاصه",
    tab_checklist: "چک‌لیست",
    tab_documents: "اسناد",
    tab_income: "درآمد",
    tab_expenses: "هزینه‌ها",
    tab_risks: "ریسک‌ها و کسورات",
    tab_audit: "گزارش حسابرسی",
    readiness: "آمادگی",
    status: "وضعیت",
    risk: "ریسک",
    missing_items: "آیتم ناقص",
    next_actions: "اقدامات بعدی",
    open: "باز",
    no_actions: "بدون اقدام — روی «ایجاد اقدامات» کلیک کنید",
    done: "✓ انجام شد",
    dismiss: "رد کردن",
    no_checklist: "آیتمی در چک‌لیست وجود ندارد",
    no_documents: "سندی بارگذاری نشده",
    upload_doc: "بارگذاری سند",
    uploading: "در حال بارگذاری...",
    approve: "تأیید",
    reject: "رد",
    view: "مشاهده",
    confidence: "اطمینان",
    extracted: "استخراج‌شده",
    no_income: "ردیف درآمد استخراج‌شده‌ای وجود ندارد",
    no_expenses: "ردیف هزینه استخراج‌شده‌ای وجود ندارد",
    deductions: "فرصت‌های کسر مالیات",
    risk_warnings: "هشدارهای ریسک",
    no_risks: "ریسکی شناسایی نشد",
    loading_risks: "در حال بارگذاری...",
    no_audit: "رویداد حسابرسی وجود ندارد",
    blocking: "مسدودکننده",
    none: "هیچ",
    reminder_preview: "پیش‌نمایش یادآوری",
    reminder_missing: "ناقص",
    status_todo: "در انتظار",
    status_waiting_client: "منتظر مشتری",
    status_uploaded: "بارگذاری شده",
    status_needs_review: "نیاز به بررسی",
    status_accepted: "پذیرفته شده",
    status_rejected: "رد شده",
    status_waived: "معاف شده",
    col_type: "نوع",
    col_description: "توضیحات",
    col_gross: "ناخالص",
    col_tax_withheld: "مالیات کسر شده",
    col_status: "وضعیت",
    col_category: "دسته‌بندی",
    col_supplier: "تأمین‌کننده",
    col_vat: "مالیات بر ارزش افزوده",
    source: "منبع ↗",
    updated: "به‌روز شد",
    checklist_updated: "آیتم چک‌لیست به‌روز شد",
    checklist_error: "به‌روزرسانی ناموفق بود",
    action_updated: "اقدام به‌روز شد",
    action_error: "به‌روزرسانی اقدام ناموفق بود",
    doc_updated: "بررسی سند به‌روز شد",
    doc_error: "بررسی سند ناموفق بود",
    income_updated: "رکورد درآمد به‌روز شد",
    income_error: "به‌روزرسانی درآمد ناموفق بود",
    expense_updated: "رکورد هزینه به‌روز شد",
    expense_error: "به‌روزرسانی هزینه ناموفق بود",
  },
};

const CHECKLIST_STATUS_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: "todo",           labelKey: "status_todo"           },
  { value: "waiting_client", labelKey: "status_waiting_client" },
  { value: "uploaded",       labelKey: "status_uploaded"       },
  { value: "needs_review",   labelKey: "status_needs_review"   },
  { value: "accepted",       labelKey: "status_accepted"       },
  { value: "rejected",       labelKey: "status_rejected"       },
  { value: "waived",         labelKey: "status_waived"         },
];

const CHECKLIST_STATUS_COLOR: Record<string, string> = {
  todo: "var(--ink-4)", waiting_client: "oklch(0.62 0.13 50)",
  uploaded: "var(--sage-600)", needs_review: "oklch(0.62 0.13 50)",
  accepted: "var(--sage-600)", rejected: "var(--danger)", waived: "var(--ink-4)",
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  candidate: "oklch(0.62 0.13 50)", approved: "var(--sage-600)",
  rejected: "var(--danger)", manual: "var(--ink-3)",
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--sage-600)", medium: "oklch(0.62 0.13 50)", high: "var(--danger)",
};

function ReadinessRing({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 85 ? "var(--sage-600)" : score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)";
  return (
    <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={45} cy={45} r={r} fill="none" stroke="var(--hairline)" strokeWidth={7} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

export default function EngagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { showToast } = useToast();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as Lang;
  const tx = TX[lang];

  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [income, setIncome] = useState<ExtractedIncome[]>([]);
  const [expenses, setExpenses] = useState<ExtractedExpense[]>([]);
  const [actions, setActions] = useState<AccountantAction[]>([]);
  const [risks, setRisks] = useState<{ opportunities: unknown[]; risks: unknown[] } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{ subject: string; body: string; missing_count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNote, setUploadNote] = useState("");

  const engId = Number(id);

  useEffect(() => {
    if (!user || !engId) return;
    void loadAll();
    const pollId = setInterval(() => void loadLive(), 10_000);
    return () => clearInterval(pollId);
  }, [user, engId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [eng, chk, docs, inc, exp, acts] = await Promise.all([
        fetchEngagement(engId),
        fetchChecklist(engId),
        fetchDocuments(engId),
        fetchIncome(engId),
        fetchExpenses(engId),
        fetchActions(engId),
      ]);
      setEngagement(eng);
      setChecklist(chk);
      setDocuments(docs);
      setIncome(inc);
      setExpenses(exp);
      setActions(acts);
      setLastUpdated(new Date());
    } catch {
      if (!silent) setError("Failed to load engagement");
    }
    if (!silent) setLoading(false);
  }

  async function loadLive() {
    try {
      const [eng, chk, docs, acts] = await Promise.all([
        fetchEngagement(engId),
        fetchChecklist(engId),
        fetchDocuments(engId),
        fetchActions(engId),
      ]);
      setEngagement(eng);
      setChecklist(chk);
      setDocuments(docs);
      setActions(acts);
      setLastUpdated(new Date());
    } catch { /* silent */ }
  }

  async function loadRisks() {
    const r = await fetchRisks(engId);
    setRisks(r);
  }

  async function loadAudit() {
    const logs = await fetchAudit(engId);
    setAuditLog(logs);
  }

  async function handleGenerateActions() {
    setGeneratingActions(true);
    try {
      const acts = await generateActions(engId);
      setActions(acts);
    } catch {
      showToast("Failed to generate actions", "error");
    }
    setGeneratingActions(false);
  }

  async function handleRecalculate() {
    try {
      const r = await recalculateReadiness(engId);
      setReadiness(r);
      const updated = await fetchEngagement(engId);
      setEngagement(updated);
    } catch {
      showToast("Recalculate failed", "error");
    }
  }

  async function handleActionStatus(actionId: number, newStatus: "done" | "dismissed") {
    // Optimistic update
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: newStatus } : a));
    try {
      await updateAction(actionId, { status: newStatus });
      showToast(tx.action_updated, "success");
    } catch {
      // Revert
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "open" } : a));
      showToast(tx.action_error, "error");
    }
  }

  async function handleChecklistStatus(itemId: number, newStatus: ChecklistItem["status"]) {
    const oldStatus = checklist.find(i => i.id === itemId)?.status;
    // Optimistic update
    setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
    try {
      const updated = await updateChecklistItem(itemId, { status: newStatus });
      setChecklist(prev => prev.map(i => i.id === itemId ? updated : i));
      showToast(tx.checklist_updated, "success");
    } catch {
      // Revert to old status
      if (oldStatus) {
        setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, status: oldStatus } : i));
      }
      showToast(tx.checklist_error, "error");
    }
  }

  async function handleReviewDoc(docId: number, newStatus: string) {
    try {
      const updated = await reviewDocument(docId, { processing_status: newStatus });
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
      showToast(tx.doc_updated, "success");
    } catch {
      showToast(tx.doc_error, "error");
    }
  }

  async function handleApproveIncome(incomeId: number, newStatus: "approved" | "rejected") {
    try {
      const updated = await updateIncome(incomeId, { review_status: newStatus });
      setIncome(prev => prev.map(i => i.id === incomeId ? updated : i));
      showToast(tx.income_updated, "success");
    } catch {
      showToast(tx.income_error, "error");
    }
  }

  async function handleApproveExpense(expenseId: number, newStatus: "approved" | "rejected") {
    try {
      const updated = await updateExpense(expenseId, { review_status: newStatus });
      setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e));
      showToast(tx.expense_updated, "success");
    } catch {
      showToast(tx.expense_error, "error");
    }
  }

  async function handleSendReminder() {
    try {
      const result = await sendReminder(engId);
      setReminderPreview(result);
    } catch {
      showToast("Failed to generate reminder", "error");
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    setUploadNote("");
    setUploadError("");
    setShowUploadModal(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleConfirmUpload() {
    if (!pendingFile || !engagement) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");
    try {
      const doc = await uploadDocument(engId, engagement.client_profile, pendingFile, {
        userTitle: uploadTitle,
        userNote: uploadNote,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setDocuments(prev => [doc, ...prev]);
      setShowUploadModal(false);
      setPendingFile(null);
      setUploadProgress(null);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
    }
    setUploading(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>{lang === "fa" ? "در حال بارگذاری..." : lang === "nl" ? "Laden..." : "Loading engagement..."}</main>
  );

  if (!engagement) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center" }}>
      <p style={{ color: "var(--ink-3)" }}>{error || "Engagement not found"}</p>
      <Link to="/accountant" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>{tx.back}</Link>
    </main>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",  label: tx.tab_overview },
    { key: "checklist", label: `${tx.tab_checklist} (${checklist.length})` },
    { key: "documents", label: `${tx.tab_documents} (${documents.length})` },
    { key: "income",    label: `${tx.tab_income} (${income.length})` },
    { key: "expenses",  label: `${tx.tab_expenses} (${expenses.length})` },
    { key: "risks",     label: tx.tab_risks },
    { key: "audit",     label: tx.tab_audit },
  ];

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--sp-6) var(--sp-6)" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: "var(--sp-4)", fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
          <Link to="/accountant" style={{ color: "var(--ink-4)", textDecoration: "none" }}>{tx.portal}</Link>
          <span style={{ margin: "0 var(--sp-2)" }}>›</span>
          <Link to={`/accountant/clients/${engagement.client_profile}`} style={{ color: "var(--ink-4)", textDecoration: "none" }}>{engagement.client_profile_display}</Link>
          <span style={{ margin: "0 var(--sp-2)" }}>›</span>
          <span style={{ color: "var(--ink)" }}>{engagement.tax_year} {engagement.engagement_type}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              {engagement.client_profile_display}
            </h1>
            <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)", fontSize: "var(--text-xs)", alignItems: "center", flexWrap: "wrap" }}>
              <span className="pill">{engagement.tax_year}</span>
              <span className="pill">{engagement.engagement_type}</span>
              <span style={{ color: RISK_COLOR[engagement.risk_level] }}>{tx.risk}: {engagement.risk_level}</span>
              <span style={{ color: engagement.missing_items_count > 0 ? "var(--danger)" : "var(--sage-600)" }}>
                {engagement.missing_items_count} {tx.missing_items}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{tx.updated} {lastUpdated.toLocaleTimeString()}</span>
            )}
            <button title="Refresh" onClick={() => void loadAll(true)} style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", fontSize: 13, padding: "2px 7px", lineHeight: 1 }}>↻</button>
            <button className="btn btn-ghost btn-sm" onClick={handleRecalculate}>{tx.recalculate}</button>
            <button className="btn btn-ghost btn-sm" onClick={handleSendReminder}>{tx.send_reminder}</button>
            <button className="btn btn-accent btn-sm" onClick={handleGenerateActions} disabled={generatingActions}>
              {generatingActions ? tx.generating : tx.generate_actions}
            </button>
          </div>
        </div>

        {/* Reminder preview */}
        {reminderPreview && (
          <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)", background: "var(--accent-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
              <strong style={{ fontSize: "var(--text-sm)" }}>{tx.reminder_preview} ({reminderPreview.missing_count} {tx.reminder_missing})</strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setReminderPreview(null)}>×</button>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "var(--text-xs)" }}>{reminderPreview.subject}</div>
            <pre style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", whiteSpace: "pre-wrap", margin: 0 }}>{reminderPreview.body}</pre>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hairline)", marginBottom: "var(--sp-5)", overflowX: "auto" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "risks") void loadRisks();
                if (t.key === "audit") void loadAudit();
              }}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 0,
                fontWeight: tab === t.key ? 600 : 400,
                borderBottom: tab === t.key ? "2px solid var(--sage-600)" : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────── */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: "var(--sp-6)", alignItems: "start" }}>
            {/* Readiness ring */}
            <div className="card" style={{ padding: "var(--sp-5)", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "var(--sp-3)" }}>
                <ReadinessRing score={engagement.readiness_score} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  fontSize: "var(--text-sm)", fontWeight: 700,
                  color: engagement.readiness_score >= 85 ? "var(--sage-600)" : engagement.readiness_score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)",
                }}>
                  {engagement.readiness_score}%
                </div>
              </div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)", marginBottom: "var(--sp-2)" }}>{tx.readiness}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{tx.status}: {engagement.status}</div>
              {readiness && (
                <div style={{ marginTop: "var(--sp-3)", textAlign: "start", fontSize: "var(--text-xs)" }}>
                  <div style={{ color: "var(--ink-3)", marginBottom: "var(--sp-2)" }}>
                    <strong>{tx.blocking}:</strong>
                    {readiness.blocking_reasons.length === 0 ? ` ${tx.none}` : (
                      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                        {readiness.blocking_reasons.map((r, i) => <li key={i} style={{ color: "var(--danger)" }}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, margin: 0 }}>{tx.next_actions}</h3>
                <span className="pill pill-accent" style={{ fontSize: "var(--text-2xs)" }}>{actions.filter(a => a.status === "open").length} {tx.open}</span>
              </div>
              {actions.length === 0 ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                  {tx.no_actions}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {actions.filter(a => a.status === "open").slice(0, 8).map(action => (
                    <div key={action.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)", borderInlineStart: `3px solid ${action.priority === "high" ? "var(--danger)" : action.priority === "medium" ? "oklch(0.62 0.13 50)" : "var(--sage-600)"}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", marginBottom: 4 }}>{action.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{action.body}</div>
                      </div>
                      <div style={{ display: "flex", gap: "var(--sp-1)", flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)", padding: "2px 8px" }} onClick={() => void handleActionStatus(action.id, "done")}>{tx.done}</button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)", padding: "2px 8px", color: "var(--ink-4)" }} onClick={() => void handleActionStatus(action.id, "dismissed")}>{tx.dismiss}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CHECKLIST ─────────────────────────────────────── */}
        {tab === "checklist" && (
          <div>
            {checklist.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_checklist}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {checklist.map(item => (
                  <div key={item.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-3)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: item.required ? 600 : 400, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
                        {item.required && <span style={{ color: "var(--danger)", marginInlineEnd: 4 }}>*</span>}
                        {item.title}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{item.description}</div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: 4 }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{item.category}</span>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{item.priority}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: CHECKLIST_STATUS_COLOR[item.status] }}>
                        {tx[`status_${item.status}`] ?? item.status}
                      </span>
                      <select
                        value={item.status}
                        onChange={e => void handleChecklistStatus(item.id, e.target.value as ChecklistItem["status"])}
                        className="tw-input"
                        style={{ fontSize: 12, padding: "2px 6px", height: 28 }}
                      >
                        {CHECKLIST_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{tx[opt.labelKey]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ─────────────────────────────────────── */}
        {showUploadModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "oklch(0 0 0 / 0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--sp-4)" }}
            onClick={e => { if (e.target === e.currentTarget && !uploading) setShowUploadModal(false); }}>
            <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-lg)", border: "1px solid var(--border-2)", padding: "var(--sp-6)", width: "100%", maxWidth: 440, boxShadow: "var(--sh-lg)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--text)", marginBottom: "var(--sp-5)" }}>{tx.upload_doc}</h2>

              {/* Form fields — frozen during upload */}
              <div style={{ opacity: uploading ? 0.55 : 1, pointerEvents: uploading ? "none" : "auto", transition: "opacity 0.2s" }}>
                <div style={{ marginBottom: "var(--sp-3)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>File</label>
                  <div style={{ padding: "var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", fontSize: "var(--text-sm)", color: "var(--text-2)", fontWeight: 600 }}>{pendingFile?.name ?? "—"}</div>
                </div>
                <div style={{ marginBottom: "var(--sp-3)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>Title (optional)</label>
                  <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", fontWeight: 600 }} />
                </div>
                <div style={{ marginBottom: "var(--sp-5)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>Note (optional)</label>
                  <textarea rows={3} value={uploadNote} onChange={e => setUploadNote(e.target.value)} style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", resize: "vertical" }} />
                </div>
              </div>

              {/* Progress bar */}
              {uploading && uploadProgress !== null && (
                <div style={{ marginBottom: "var(--sp-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)" }}>
                      {uploadProgress < 100 ? "Uploading…" : "Saving…"}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--bg-3)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--blue) 0%, var(--blue-text) 100%)", width: `${uploadProgress}%`, transition: "width 0.25s ease" }} />
                  </div>
                </div>
              )}

              {/* Error banner */}
              {uploadError && (
                <div style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)", background: "var(--danger-subtle)", borderRadius: "var(--r-sm)", border: "1px solid var(--danger)", display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--danger-text)", fontSize: "var(--text-sm)", marginBottom: 2 }}>Upload failed</div>
                    <div style={{ color: "var(--danger-text)", fontSize: "var(--text-xs)", fontWeight: 500, opacity: 0.85 }}>{uploadError}</div>
                  </div>
                  <button onClick={() => setUploadError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger-text)", fontSize: 16, padding: 0, flexShrink: 0, opacity: 0.7 }}>✕</button>
                </div>
              )}

              {/* Buttons — hidden while uploading */}
              {!uploading && (
                <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowUploadModal(false); setPendingFile(null); setUploadError(""); }}>Cancel</button>
                  <button className="btn btn-accent btn-sm" onClick={() => void handleConfirmUpload()}>Upload</button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div>
            <div style={{ marginBottom: "var(--sp-4)", display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx" style={{ display: "none" }} onChange={handleFileChosen} />
              <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {tx.upload_doc}
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_documents}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {documents.map(doc => (
                  <div key={doc.id} className="card" style={{ padding: "var(--sp-3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)" }}>
                          {doc.user_title || doc.original_filename}
                        </div>
                        {doc.user_note && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", marginTop: 2 }}>{doc.user_note}</div>}
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                          {doc.original_filename} · {(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.extracted_json && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>
                            {tx.confidence}: {((doc.confidence_score || 0) * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: doc.processing_status === "approved" ? "var(--sage-600)" : doc.processing_status === "rejected" ? "var(--danger)" : "oklch(0.62 0.13 50)" }}>
                          {doc.processing_status}
                        </span>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-2xs)" }}>{tx.view}</a>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => void handleReviewDoc(doc.id, "approved")}>{tx.approve}</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => void handleReviewDoc(doc.id, "rejected")}>{tx.reject}</button>
                      </div>
                    </div>
                    {doc.extracted_json && (
                      <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2)", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                        <strong>{tx.extracted}:</strong>{" "}
                        {Object.entries(doc.extracted_json).filter(([k, v]) => v && k !== "issues").map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INCOME ─────────────────────────────────────────── */}
        {tab === "income" && (
          <div>
            {income.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_income}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
                      {[tx.col_type, tx.col_description, tx.col_gross, tx.col_tax_withheld, tx.col_status, ""].map(h => (
                        <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textAlign: "start" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {income.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}><span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{inc.income_type}</span></td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{inc.description}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>€{parseFloat(inc.gross_amount).toLocaleString()}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{inc.tax_withheld ? `€${parseFloat(inc.tax_withheld).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[inc.review_status] }}>{inc.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {inc.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => void handleApproveIncome(inc.id, "approved")}>{tx.approve}</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => void handleApproveIncome(inc.id, "rejected")}>{tx.reject}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EXPENSES ─────────────────────────────────────────── */}
        {tab === "expenses" && (
          <div>
            {expenses.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_expenses}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
                      {[tx.col_category, tx.col_supplier, tx.col_gross, tx.col_vat, tx.col_status, ""].map(h => (
                        <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textAlign: "start" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}><span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{exp.expense_category}</span></td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{exp.supplier_name || "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>€{parseFloat(exp.amount_gross).toLocaleString()}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{exp.vat_amount ? `€${parseFloat(exp.vat_amount).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[exp.review_status] }}>{exp.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {exp.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--sage-600)", fontSize: "var(--text-2xs)" }} onClick={() => void handleApproveExpense(exp.id, "approved")}>{tx.approve}</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: "var(--text-2xs)" }} onClick={() => void handleApproveExpense(exp.id, "rejected")}>{tx.reject}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── RISKS ─────────────────────────────────────────── */}
        {tab === "risks" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-5)" }}>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.deductions}</h3>
              {(!risks || (risks.opportunities as unknown[]).length === 0) ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)" }}>{tx.loading_risks}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  {(risks.opportunities as Array<{ id: string; title: string; description: string; confidence?: string; rule_id?: string; source_url?: string }>).map(opp => (
                    <div key={opp.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${opp.confidence === "likely" ? "var(--sage-600)" : opp.confidence === "needs_confirmation" ? "oklch(0.62 0.13 50)" : "var(--ink-4)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{opp.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{opp.description}</div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", alignItems: "center" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)", background: opp.confidence === "likely" ? "var(--accent-soft)" : "var(--paper-3)" }}>{opp.confidence || "—"}</span>
                        {opp.source_url && <a href={opp.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-2xs)", color: "var(--sage-600)" }}>{tx.source}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, marginBottom: "var(--sp-3)" }}>{tx.risk_warnings}</h3>
              {(!risks || (risks.risks as unknown[]).length === 0) ? (
                <div className="card" style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_risks}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  {(risks.risks as Array<{ id: string; title: string; description: string; level?: string; source_url?: string }>).map(risk => (
                    <div key={risk.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${risk.level === "needs_accountant_review" ? "var(--danger)" : "oklch(0.62 0.13 50)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{risk.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{risk.description}</div>
                      <div style={{ marginTop: "var(--sp-2)" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{risk.level}</span>
                        {risk.source_url && <a href={risk.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-2xs)", color: "var(--sage-600)", marginInlineStart: "var(--sp-2)" }}>{tx.source}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUDIT ─────────────────────────────────────────── */}
        {tab === "audit" && (
          <div>
            {auditLog.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_audit}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {auditLog.map(log => (
                  <div key={log.id} style={{ display: "flex", gap: "var(--sp-3)", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--hairline)", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--ink-4)", flexShrink: 0, width: 160 }}>{new Date(log.created_at).toLocaleString()}</span>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>{log.actor_email || "system"}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{log.action}</span>
                    <span style={{ color: "var(--ink-4)" }}>{log.entity_type} #{log.entity_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
