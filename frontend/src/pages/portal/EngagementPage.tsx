import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { formatDate, formatEur } from "../../lib/utils";
import { ChevronRight, Download, FileText, RefreshCw, X, AlertTriangle, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import Modal from "../../components/ui/Modal";
import ReadinessCard from "../../components/ui/ReadinessCard";
import CopilotCard from "../../components/ui/CopilotCard";
import {
  fetchEngagement, fetchChecklist, fetchDocuments,
  fetchIncome, fetchExpenses, fetchActions, generateActions, fetchRisks,
  fetchAudit, updateChecklistItem, reviewDocument, sendReminder,
  recalculateReadiness, updateAction, updateIncome, updateExpense,
  uploadDocument,
} from "../../api/portal/client";
import {
  fetchEngagementMessages, sendEngagementMessage,
  type PortalMessage,
} from "../../api/portal/messages";
import type {
  TaxEngagement, ChecklistItem, ClientDocument,
  ExtractedIncome, ExtractedExpense, AccountantAction, ReadinessResult, AuditLog,
} from "../../api/portal/types";

type Tab = "overview" | "checklist" | "documents" | "income" | "expenses" | "risks" | "messages" | "audit";
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
    reminder_sent: "Reminder sent",
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
    doc_filter_all: "All",
    doc_filter_missing: "Missing",
    doc_filter_processing: "Processing",
    doc_filter_needs_review: "Needs Review",
    doc_filter_approved: "Approved",
    doc_filter_rejected: "Rejected",
    reject_reason_label: "Reason for rejection",
    reject_reason_placeholder: "Explain why this document was rejected...",
    reject_reason_submit: "Reject document",
    copilot_title: "AI Copilot",
    tab_messages: "Messages",
    msg_placeholder: "Type a message… (Enter to send)",
    msg_send: "Send",
    msg_no_messages: "No messages yet",
    missing_required_items: "Missing Required Items",
    go_to_checklist: "Go to Checklist →",
    all_items_provided: "All required items provided",
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
    reminder_sent: "Herinnering verzonden",
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
    doc_filter_all: "Alle",
    doc_filter_missing: "Ontbreekt",
    doc_filter_processing: "Verwerking",
    doc_filter_needs_review: "Te beoordelen",
    doc_filter_approved: "Goedgekeurd",
    doc_filter_rejected: "Afgewezen",
    reject_reason_label: "Reden voor afwijzing",
    reject_reason_placeholder: "Leg uit waarom dit document is afgewezen...",
    reject_reason_submit: "Document afwijzen",
    copilot_title: "AI Copilot",
    tab_messages: "Berichten",
    msg_placeholder: "Typ een bericht… (Enter om te sturen)",
    msg_send: "Sturen",
    msg_no_messages: "Nog geen berichten",
    done: "Klaar",
    missing_required_items: "Ontbrekende verplichte items",
    go_to_checklist: "Naar checklist →",
    all_items_provided: "Alle verplichte items aangeleverd",
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
    reminder_sent: "یادآوری ارسال شد",
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
    doc_filter_all: "همه",
    doc_filter_missing: "ناقص",
    doc_filter_processing: "در حال پردازش",
    doc_filter_needs_review: "نیاز به بررسی",
    doc_filter_approved: "تأیید شده",
    doc_filter_rejected: "رد شده",
    reject_reason_label: "دلیل رد",
    reject_reason_placeholder: "توضیح دهید چرا این سند رد شد...",
    reject_reason_submit: "رد سند",
    copilot_title: "دستیار هوش مصنوعی",
    tab_messages: "پیام‌ها",
    msg_placeholder: "پیام بنویسید… (Enter برای ارسال)",
    msg_send: "ارسال",
    msg_no_messages: "هنوز پیامی وجود ندارد",
    done: "انجام شد",
    missing_required_items: "آیتم‌های اجباری ناقص",
    go_to_checklist: "← رفتن به چک‌لیست",
    all_items_provided: "همه موارد اجباری ارائه شده",
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
  todo: "var(--ink-4)", waiting_client: "var(--warn)",
  uploaded: "var(--ok)", needs_review: "var(--warn)",
  accepted: "var(--ok)", rejected: "var(--danger)", waived: "var(--ink-4)",
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  candidate: "var(--warn)", approved: "var(--ok)",
  rejected: "var(--danger)", manual: "var(--ink-3)",
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--ok)", medium: "var(--warn)", high: "var(--danger)",
};


export default function EngagementPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
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

  const initialTab = (searchParams.get("tab") as Tab) ?? "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{ subject: string; body: string; missing_count: number } | null>(null);

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const selectedDoc = documents.find(d => d.id === selectedDocId) ?? null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNote, setUploadNote] = useState("");

  type DocFilter = "all" | "missing" | "processing" | "needs_review" | "approved" | "rejected";
  const [docFilter, setDocFilter] = useState<DocFilter>("all");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetDocId, setRejectTargetDocId] = useState<number | null>(null);

  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const engId = Number(id);

  useEffect(() => {
    if (!user || !engId) return;
    void loadAll();
    if (initialTab === "messages") void loadMessages();
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

  async function loadMessages() {
    try {
      const msgs = await fetchEngagementMessages(engId);
      setMessages(msgs);
    } catch { /* silent */ }
  }

  async function handleSendMessage() {
    if (!msgBody.trim()) return;
    setSendingMsg(true);
    try {
      const msg = await sendEngagementMessage(engId, msgBody.trim());
      setMessages(prev => [...prev, msg]);
      setMsgBody("");
    } catch {
      showToast("Failed to send message", "error");
    }
    setSendingMsg(false);
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

  async function fetchDocumentBlob(fileUrl: string): Promise<string | null> {
    const token = localStorage.getItem("access_token") ?? "";
    const res = await fetch(fileUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { detail?: string };
      showToast(data.detail ?? "File not found. Please re-upload.", "error");
      return null;
    }
    return URL.createObjectURL(await res.blob());
  }

  async function viewDocumentFile(fileUrl: string) {
    try {
      const blobUrl = await fetchDocumentBlob(fileUrl);
      if (!blobUrl) return;
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      showToast("Could not open document.", "error");
    }
  }

  async function downloadDocumentFile(fileUrl: string, filename: string) {
    try {
      const blobUrl = await fetchDocumentBlob(fileUrl);
      if (!blobUrl) return;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      showToast("Could not download document.", "error");
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

  async function handleRejectWithReason() {
    if (!rejectTargetDocId) return;
    try {
      const updated = await reviewDocument(rejectTargetDocId, { processing_status: "rejected", review_notes: rejectReason });
      setDocuments(prev => prev.map(d => d.id === rejectTargetDocId ? updated : d));
      showToast(tx.doc_updated, "success");
    } catch {
      showToast(tx.doc_error, "error");
    }
    setShowRejectDialog(false);
    setRejectReason("");
    setRejectTargetDocId(null);
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
    { key: "messages",  label: `${tx.tab_messages} (${messages.length})` },
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
              <span style={{ color: engagement.missing_items_count > 0 ? "var(--danger)" : "var(--ok)" }}>
                {engagement.missing_items_count} {tx.missing_items}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: "var(--blue-subtle)", color: "var(--blue-text)" }}>
                {tx.readiness}: {engagement.readiness_score}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{tx.updated} {lastUpdated.toLocaleTimeString()}</span>
            )}
            <button title="Refresh" onClick={() => void loadAll(true)} style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", padding: "4px 7px", display: "flex", alignItems: "center" }}><RefreshCw size={12} /></button>
            <button className="btn btn-ghost btn-sm" onClick={handleRecalculate}>{tx.recalculate}</button>
            <button className="btn btn-ghost btn-sm" onClick={handleSendReminder}>{tx.send_reminder}</button>
            <button className="btn btn-accent btn-sm" onClick={handleGenerateActions} disabled={generatingActions}>
              {generatingActions ? tx.generating : tx.generate_actions}
            </button>
          </div>
        </div>

        {/* Reminder sent confirmation */}
        {reminderPreview && (
          <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)", background: "var(--ok-soft)", border: "1px solid var(--ok)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-2)" }}>
              <strong style={{ fontSize: "var(--text-sm)", color: "var(--ok-text)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--ok)", color: "#fff", display: "inline-grid", placeItems: "center", fontSize: 9, flexShrink: 0 }}>✓</span>
                {tx.reminder_sent} — {reminderPreview.missing_count} {tx.reminder_missing}
              </strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setReminderPreview(null)} style={{ padding: "0 6px" }}><X size={12} /></button>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{reminderPreview.subject}</div>
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
                if (t.key === "messages") void loadMessages();
              }}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 0,
                fontWeight: tab === t.key ? 600 : 400,
                borderBottom: tab === t.key ? "2px solid var(--blue)" : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────── */}
        {tab === "overview" && (() => {
          const missingItems = checklist.filter(
            i => i.required && (i.status === "todo" || i.status === "waiting_client")
          );
          return (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: "var(--sp-6)", alignItems: "start" }}>
            {/* Main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
              {/* Readiness + Actions row */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: "var(--sp-6)", alignItems: "start" }}>
                {/* ReadinessCard */}
                <div>
                  <ReadinessCard score={engagement.readiness_score} />
                  {readiness && readiness.blocking_reasons.length > 0 && (
                    <div className="card" style={{ padding: "var(--sp-3)", marginTop: "var(--sp-3)", fontSize: "var(--text-xs)" }}>
                      <strong style={{ color: "var(--danger)", display: "block", marginBottom: "var(--sp-2)" }}>{tx.blocking}:</strong>
                      <ul style={{ margin: 0, paddingInlineStart: "var(--sp-4)" }}>
                        {readiness.blocking_reasons.map((r, i) => <li key={i} style={{ color: "var(--danger)", marginBottom: 2 }}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: "var(--sp-2)" }}>{tx.status}: {engagement.status}</div>
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
                        <div key={action.id} className="card" style={{ padding: "var(--sp-3)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)", borderInlineStart: `3px solid ${action.priority === "high" ? "var(--danger)" : action.priority === "medium" ? "var(--warn)" : "var(--ok)"}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", marginBottom: 4 }}>{action.title}</div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{action.body}</div>
                          </div>
                          <div style={{ display: "flex", gap: "var(--sp-1)", flexShrink: 0 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => void handleActionStatus(action.id, "done")}>{tx.done}</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-4)" }} onClick={() => void handleActionStatus(action.id, "dismissed")}>{tx.dismiss}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Missing Required Items ── full-width, only when items are missing */}
              {missingItems.length > 0 && (
                <div className="card" style={{
                  padding: "var(--sp-4)",
                  borderTop: "3px solid var(--danger)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                      <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--danger)" }}>
                        {tx.missing_required_items}
                      </span>
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: 999,
                        background: "var(--danger)", color: "#fff",
                        fontSize: 11, fontWeight: 800,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        padding: "0 6px",
                      }}>
                        {missingItems.length}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "var(--text-xs)", color: "var(--blue)" }}
                      onClick={() => setTab("checklist")}
                    >
                      {tx.go_to_checklist}
                    </button>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "var(--sp-2)",
                  }}>
                    {missingItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setTab("checklist")}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "var(--sp-3)",
                          padding: "var(--sp-3)", borderRadius: "var(--r-sm)",
                          background: "var(--danger-subtle)",
                          border: "1px solid var(--danger)",
                          cursor: "pointer", textAlign: "start",
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: "var(--danger)", flexShrink: 0, marginTop: 4,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--danger-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.description}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "var(--sp-1)", marginTop: "var(--sp-1)", flexWrap: "wrap" }}>
                            <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{item.category}</span>
                            <span className="pill" style={{ fontSize: "var(--text-2xs)", color: item.status === "waiting_client" ? "var(--warn-text)" : "var(--ink-3)", background: item.status === "waiting_client" ? "var(--warn-subtle)" : undefined }}>
                              {tx[`status_${item.status}`] ?? item.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: AI Copilot panel (desktop only) ── */}
            {!isMobile && (
              <aside style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                  <Bot size={14} style={{ color: "var(--blue)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>{tx.copilot_title}</span>
                </div>
                <CopilotCard
                  type="client_summary"
                  title={engagement.client_profile_display}
                  body={`${engagement.tax_year} · ${engagement.engagement_type} · ${engagement.missing_items_count} ${tx.missing_items}`}
                  sources={["Profile", "Engagement"]}
                  confidence="high"
                />
                {engagement.risk_level !== "low" && (
                  <CopilotCard
                    type="risk_summary"
                    title={tx.risk_warnings}
                    body={`Risk level: ${engagement.risk_level}. Review flagged items before filing.`}
                    sources={["Documents", "Rules"]}
                    confidence={engagement.risk_level === "high" ? "low" : "medium"}
                  />
                )}
                <CopilotCard
                  type="next_action"
                  title={tx.next_actions}
                  body={`${actions.filter(a => a.status === "open").length} open actions require attention.`}
                  items={actions.filter(a => a.status === "open").slice(0, 3).map(a => a.title)}
                  sources={["Engagement"]}
                />
              </aside>
            )}
          </div>
          );
        })()}

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

        {/* ── UPLOAD MODAL ─────────────────────────────────── */}
        <Modal
          open={showUploadModal}
          onClose={() => { if (!uploading) { setShowUploadModal(false); setPendingFile(null); setUploadError(""); } }}
          title={tx.upload_doc}
          maxWidth={440}
          noBackdropClose={uploading}
        >
          <div style={{ opacity: uploading ? 0.55 : 1, pointerEvents: uploading ? "none" : "auto", transition: "opacity 0.2s" }}>
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>File</label>
              <div style={{ padding: "var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", fontSize: "var(--text-sm)", color: "var(--text-2)", fontWeight: 600 }}>{pendingFile?.name ?? "—"}</div>
            </div>
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>Title (optional)</label>
              <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", fontWeight: 600, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "var(--sp-5)" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>Note (optional)</label>
              <textarea rows={3} value={uploadNote} onChange={e => setUploadNote(e.target.value)} style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>

          {uploading && uploadProgress !== null && (
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)" }}>{uploadProgress < 100 ? "Uploading…" : "Saving…"}</span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "var(--bg-3)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--blue) 0%, var(--blue-text) 100%)", width: `${uploadProgress}%`, transition: "width 0.25s ease" }} />
              </div>
            </div>
          )}

          {uploadError && (
            <div style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)", background: "var(--danger-subtle)", borderRadius: "var(--r-sm)", border: "1px solid var(--danger)", display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
              <AlertTriangle size={18} style={{ color: "var(--danger-text)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--danger-text)", fontSize: "var(--text-sm)", marginBottom: 2 }}>Upload failed</div>
                <div style={{ color: "var(--danger-text)", fontSize: "var(--text-xs)", fontWeight: 500 }}>{uploadError}</div>
              </div>
              <button onClick={() => setUploadError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, flexShrink: 0, display: "flex" }}><X size={14} /></button>
            </div>
          )}

          {!uploading && (
            <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowUploadModal(false); setPendingFile(null); setUploadError(""); }}>Cancel</button>
              <button className="btn btn-accent btn-sm" onClick={() => void handleConfirmUpload()}>Upload</button>
            </div>
          )}
        </Modal>

        {/* ── REJECT REASON MODAL ──────────────────────────── */}
        <Modal
          open={showRejectDialog}
          onClose={() => { setShowRejectDialog(false); setRejectReason(""); setRejectTargetDocId(null); }}
          title={tx.reject}
          maxWidth={420}
        >
          <div style={{ marginBottom: "var(--sp-4)" }}>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase" }}>{tx.reject_reason_label}</label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={tx.reject_reason_placeholder}
              style={{ width: "100%", padding: "var(--sp-3)", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowRejectDialog(false); setRejectReason(""); setRejectTargetDocId(null); }}>Cancel</button>
            <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff", border: "none", borderRadius: "var(--r-sm)", padding: "0 var(--sp-4)", cursor: "pointer", fontWeight: 700, fontSize: "var(--text-sm)" }} onClick={() => void handleRejectWithReason()}>
              {tx.reject_reason_submit}
            </button>
          </div>
        </Modal>

        {tab === "documents" && (
          <div>
            {/* Upload button + doc filter tabs */}
            <div style={{ marginBottom: "var(--sp-4)", display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx" style={{ display: "none" }} onChange={handleFileChosen} />
              <button className="btn btn-accent btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {tx.upload_doc}
              </button>
              <div style={{ display: "flex", gap: 2, marginInlineStart: "auto" }}>
                {(["all", "missing", "processing", "needs_review", "approved", "rejected"] as DocFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setDocFilter(f)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, cursor: "pointer",
                      background: docFilter === f ? "var(--blue)" : "transparent",
                      color: docFilter === f ? "#fff" : "var(--ink-3)",
                      border: `1px solid ${docFilter === f ? "var(--blue)" : "var(--hairline-2)"}`,
                    }}
                  >
                    {tx[`doc_filter_${f}`]}
                  </button>
                ))}
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.no_documents}</div>
            ) : (() => {
              const filtered = docFilter === "all" ? documents
                : docFilter === "needs_review" ? documents.filter(d => d.processing_status === "needs_review")
                : docFilter === "approved" ? documents.filter(d => d.processing_status === "approved")
                : docFilter === "rejected" ? documents.filter(d => d.processing_status === "rejected")
                : docFilter === "processing" ? documents.filter(d => d.processing_status === "uploaded" || d.processing_status === "extracted")
                : documents.filter(d => !d.file_url); // "missing"
              return (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: "var(--sp-4)", alignItems: "start" }}>

                {/* Left: file list (filtered) */}
                <div style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--paper-2)" }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-4)", fontSize: "var(--text-sm)" }}>{tx.no_documents}</div>
                  ) : filtered.map((doc, i) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "var(--sp-3)",
                        width: "100%", padding: "var(--sp-3) var(--sp-4)",
                        background: selectedDocId === doc.id ? "var(--paper-3)" : "transparent",
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--hairline)" : "none",
                        border: "none", borderRadius: 0,
                        cursor: "pointer", textAlign: "start",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: REVIEW_STATUS_COLOR[doc.processing_status] ?? "var(--ink-4)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.user_title || doc.original_filename}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 1 }}>
                          {(doc.file_size / 1024).toFixed(0)} KB · {formatDate(doc.created_at)}
                        </div>
                      </div>
                      <ChevronRight size={12} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>

                {/* Right: detail panel */}
                {selectedDoc ? (
                  <div className="card" style={{ padding: "var(--sp-5)" }}>
                    <div style={{ marginBottom: "var(--sp-4)", paddingBottom: "var(--sp-4)", borderBottom: "1px solid var(--hairline)" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--ink)", margin: "0 0 4px" }}>
                        {selectedDoc.user_title || selectedDoc.original_filename}
                      </h3>
                      {selectedDoc.user_note && <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", margin: 0 }}>{selectedDoc.user_note}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
                      {([
                        ["File", selectedDoc.original_filename],
                        ["Size", `${(selectedDoc.file_size / 1024).toFixed(0)} KB`],
                        ["Status", selectedDoc.processing_status],
                        [tx.confidence, selectedDoc.confidence_score ? `${(selectedDoc.confidence_score * 100).toFixed(0)}%` : "—"],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ padding: "var(--sp-3)", background: "var(--paper-3)", borderRadius: "var(--r-sm)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", marginBottom: 3 }}>{k}</div>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {selectedDoc.extracted_json && (
                      <div style={{ marginBottom: "var(--sp-4)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", marginBottom: "var(--sp-2)" }}>{tx.extracted}</div>
                        <div style={{ padding: "var(--sp-3)", background: "var(--paper-3)", borderRadius: "var(--r-sm)", fontSize: "var(--text-xs)", color: "var(--ink-2)", lineHeight: 1.7 }}>
                          {Object.entries(selectedDoc.extracted_json).filter(([k, v]) => v && k !== "issues").map(([k, v]) => (
                            <div key={k} style={{ display: "flex", gap: 8 }}>
                              <span style={{ color: "var(--ink-4)", minWidth: 90, flexShrink: 0 }}>{k}</span>
                              <span style={{ fontWeight: 500 }}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                      {selectedDoc.file_url && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => void viewDocumentFile(selectedDoc.file_url!)}>{tx.view} ↗</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "0 8px" }} title="Download" onClick={() => void downloadDocumentFile(selectedDoc.file_url!, selectedDoc.original_filename)}>
                            <Download size={14} />
                          </button>
                        </>
                      )}
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--ok)" }} onClick={() => void handleReviewDoc(selectedDoc.id, "approved")}>{tx.approve}</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => { setRejectTargetDocId(selectedDoc.id); setRejectReason(""); setShowRejectDialog(true); }}>{tx.reject}</button>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: "var(--sp-10)", textAlign: "center", color: "var(--ink-4)" }}>
                    <FileText size={28} style={{ margin: "0 auto var(--sp-3)", opacity: 0.35, display: "block" }} />
                    <div style={{ fontSize: "var(--text-sm)" }}>
                      {lang === "nl" ? "Selecteer een document om te bekijken" : lang === "fa" ? "یک سند را برای بررسی انتخاب کنید" : "Select a document to review"}
                    </div>
                  </div>
                )}
              </div>
              );
            })()}
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
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>{formatEur(parseFloat(inc.gross_amount))}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{inc.tax_withheld ? formatEur(parseFloat(inc.tax_withheld)) : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[inc.review_status] }}>{inc.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {inc.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--ok)" }} onClick={() => void handleApproveIncome(inc.id, "approved")}>{tx.approve}</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => void handleApproveIncome(inc.id, "rejected")}>{tx.reject}</button>
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

        {/* ── MESSAGES ─────────────────────────────────────────── */}
        {tab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", maxHeight: 480, overflowY: "auto", paddingBottom: "var(--sp-2)" }}>
              {messages.length === 0 ? (
                <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.msg_no_messages}</div>
              ) : messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: "var(--sp-3)", flexDirection: msg.is_own ? "row-reverse" : "row" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: msg.is_own ? "var(--blue)" : "var(--bg-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: msg.is_own ? "#fff" : "var(--text-3)", flexShrink: 0,
                  }}>
                    {(msg.sender_name || msg.sender_email)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ maxWidth: "70%" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", marginBottom: 4, textAlign: msg.is_own ? "right" : "left" }}>
                      {msg.sender_name || msg.sender_email} · {new Date(msg.created_at).toLocaleString("nl-NL")}
                    </div>
                    <div style={{
                      background: msg.is_own ? "var(--blue)" : "var(--bg-3)",
                      color: msg.is_own ? "#fff" : "var(--text)",
                      borderRadius: "var(--r-md)", padding: "var(--sp-3) var(--sp-4)",
                      fontSize: "var(--text-sm)", lineHeight: 1.55,
                    }}>
                      {msg.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-end" }}>
              <textarea
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }}
                placeholder={tx.msg_placeholder}
                rows={3}
                style={{
                  flex: 1, padding: "var(--sp-3)", background: "var(--bg-3)",
                  border: "1px solid var(--border-2)", borderRadius: "var(--r-md)",
                  color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit",
                  resize: "none", boxSizing: "border-box",
                }}
              />
              <button
                className="btn btn-accent btn-sm"
                onClick={() => void handleSendMessage()}
                disabled={sendingMsg || !msgBody.trim()}
                style={{ alignSelf: "flex-end", minWidth: 80 }}
              >
                {tx.msg_send}
              </button>
            </div>
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
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600 }}>{formatEur(parseFloat(exp.amount_gross))}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--ink-3)" }}>{exp.vat_amount ? formatEur(parseFloat(exp.vat_amount)) : "—"}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: REVIEW_STATUS_COLOR[exp.review_status] }}>{exp.review_status}</span>
                        </td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)" }}>
                          {exp.review_status === "candidate" && (
                            <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--ok)" }} onClick={() => void handleApproveExpense(exp.id, "approved")}>{tx.approve}</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => void handleApproveExpense(exp.id, "rejected")}>{tx.reject}</button>
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
                    <div key={opp.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${opp.confidence === "likely" ? "var(--ok)" : opp.confidence === "needs_confirmation" ? "var(--warn)" : "var(--ink-4)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{opp.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{opp.description}</div>
                      <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", alignItems: "center" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)", background: opp.confidence === "likely" ? "var(--accent-soft)" : "var(--paper-3)" }}>{opp.confidence || "—"}</span>
                        {opp.source_url && <a href={opp.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-2xs)", color: "var(--ok)" }}>{tx.source}</a>}
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
                    <div key={risk.id} className="card" style={{ padding: "var(--sp-3)", borderInlineStart: `3px solid ${risk.level === "needs_accountant_review" ? "var(--danger)" : "var(--warn)"}` }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{risk.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{risk.description}</div>
                      <div style={{ marginTop: "var(--sp-2)" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{risk.level}</span>
                        {risk.source_url && <a href={risk.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-2xs)", color: "var(--ok)", marginInlineStart: "var(--sp-2)" }}>{tx.source}</a>}
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
                    <span style={{ color: "var(--ink-4)", flexShrink: 0, width: 160 }}>{new Date(log.created_at).toLocaleString("nl-NL")}</span>
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
