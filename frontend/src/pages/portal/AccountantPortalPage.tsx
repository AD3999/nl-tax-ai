import { useEffect, useState, Component, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, Zap, X, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import {
  fetchClients, fetchEngagements, disconnectClient, reactivateClient,
} from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";
import { useToast } from "../../context/ToastContext";
import { ENGAGEMENT_TYPE_LABELS } from "../../lib/engagementTypes";
import { getEngagementStatusLabel, getClientStatusLabel } from "../../lib/engagementStatus";
import {
  sendPortalInvitation, fetchPortalInvitations, cancelPortalInvitation,
  type PortalInvitation,
} from "../../api/portal/client";
import { createClient } from "../../api/portal/client";
import type { ClientType } from "../../api/portal/types";

// Local error boundary so a render crash in the tab area shows an inline
// "Retry" instead of the full-page "Something went wrong" ErrorBoundary.
class TabErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  // Do NOT call onReset() here — invoking parent state setters inside
  // componentDidCatch triggers state updates while React is mid-recovery and
  // can propagate the error to the global ErrorBoundary.
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
          Failed to load client data.{" "}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TX: Record<string, Record<string, string>> = {
  en: {
    title: "Accountant Portal",
    subtitle: "Manage your clients and their document collection",
    badge: "Accountant",
    login_required: "Log in to access the accountant portal",
    login_btn: "Log in",
    clients_tab: "Clients",
    engagements_tab: "Engagements",
    add_client: "+ Add client",
    new_engagement: "+ New engagement",
    no_clients: "No clients yet — add your first client",
    no_engagements: "No engagements — create one from a client profile",
    email_label: "Client email",
    first_name_label: "First name",
    last_name_label: "Last name",
    type_label: "Client type",
    lang_label: "Language",
    notes_label: "Notes",
    add_btn: "Add client",
    cancel: "Cancel",
    view_client: "View",
    readiness: "Readiness",
    missing: "missing",
    status: "Status",
    risk: "Risk",
    type: "Type",
    open_eng: "Open",
    waiting: "Waiting client",
    needs_review: "Needs review",
    ready: "Ready to file",
    urgent: "Urgent",
    total_clients: "Total clients",
    collecting: "Collecting",
    filed: "Filed",
    invitations_tab:    "Invitations",
    invite_title:       "Invite a client",
    invite_email:       "Client email address",
    invite_message:     "Personal message (optional)",
    invite_btn:         "Send invitation",
    invite_sent:        "Invitation sent!",
    invite_error_dup:   "A pending invitation already exists for this email.",
    no_invitations:     "No invitations sent yet",
    inv_status_pending:  "Pending",
    inv_status_accepted: "Accepted",
    inv_status_declined: "Declined",
    inv_status_cancelled:"Cancelled",
    cancel_inv:          "Cancel",
    pending_invitations: "Pending",
  },
  nl: {
    title: "Accountant Portal",
    subtitle: "Beheer uw klanten en hun documentenverzameling",
    badge: "Accountant",
    login_required: "Log in om de accountantportal te bekijken",
    login_btn: "Inloggen",
    clients_tab: "Klanten",
    engagements_tab: "Dossiers",
    add_client: "+ Klant toevoegen",
    new_engagement: "+ Nieuw dossier",
    no_clients: "Nog geen klanten — voeg uw eerste klant toe",
    no_engagements: "Geen dossiers — maak er een aan vanuit een klantprofiel",
    email_label: "E-mailadres klant",
    first_name_label: "Voornaam",
    last_name_label: "Achternaam",
    type_label: "Klanttype",
    lang_label: "Taal",
    notes_label: "Notities",
    add_btn: "Klant toevoegen",
    cancel: "Annuleren",
    view_client: "Bekijken",
    readiness: "Gereedheid",
    missing: "ontbreekt",
    status: "Status",
    risk: "Risico",
    type: "Type",
    open_eng: "Open",
    waiting: "Wacht op klant",
    needs_review: "Beoordeling nodig",
    ready: "Klaar om in te dienen",
    urgent: "Urgent",
    total_clients: "Totaal klanten",
    collecting: "Verzamelen",
    filed: "Ingediend",
    invitations_tab:    "Uitnodigingen",
    invite_title:       "Klant uitnodigen",
    invite_email:       "E-mailadres klant",
    invite_message:     "Persoonlijk bericht (optioneel)",
    invite_btn:         "Uitnodiging versturen",
    invite_sent:        "Uitnodiging verstuurd!",
    invite_error_dup:   "Er bestaat al een openstaande uitnodiging voor dit e-mailadres.",
    no_invitations:     "Nog geen uitnodigingen verstuurd",
    inv_status_pending:  "In afwachting",
    inv_status_accepted: "Geaccepteerd",
    inv_status_declined: "Geweigerd",
    inv_status_cancelled:"Geannuleerd",
    cancel_inv:          "Annuleren",
    pending_invitations: "In afwachting",
  },
  fa: {
    title: "پورتال حسابدار",
    subtitle: "مشتریان و جمع‌آوری اسناد آن‌ها را مدیریت کنید",
    badge: "حسابدار",
    login_required: "برای دسترسی به پورتال حسابدار وارد شوید",
    login_btn: "ورود",
    clients_tab: "مشتریان",
    engagements_tab: "پرونده‌ها",
    add_client: "+ افزودن مشتری",
    new_engagement: "+ پرونده جدید",
    no_clients: "هنوز مشتری‌ای وجود ندارد — اولین مشتری خود را اضافه کنید",
    no_engagements: "پرونده‌ای وجود ندارد — از پروفایل مشتری ایجاد کنید",
    email_label: "ایمیل مشتری",
    first_name_label: "نام",
    last_name_label: "نام خانوادگی",
    type_label: "نوع مشتری",
    lang_label: "زبان",
    notes_label: "یادداشت‌ها",
    add_btn: "افزودن مشتری",
    cancel: "لغو",
    view_client: "مشاهده",
    readiness: "آمادگی",
    missing: "کم دارد",
    status: "وضعیت",
    risk: "ریسک",
    type: "نوع",
    open_eng: "باز",
    waiting: "منتظر مشتری",
    needs_review: "نیاز به بررسی",
    ready: "آماده ارسال",
    urgent: "فوری",
    total_clients: "کل مشتریان",
    collecting: "جمع‌آوری",
    filed: "ارسال شده",
    invitations_tab:    "دعوت‌نامه‌ها",
    invite_title:       "دعوت از مشتری",
    invite_email:       "آدرس ایمیل مشتری",
    invite_message:     "پیام شخصی (اختیاری)",
    invite_btn:         "ارسال دعوت‌نامه",
    invite_sent:        "دعوت‌نامه ارسال شد!",
    invite_error_dup:   "یک دعوت‌نامه در حال انتظار برای این ایمیل وجود دارد.",
    no_invitations:     "هنوز دعوت‌نامه‌ای ارسال نشده",
    inv_status_pending:  "در انتظار",
    inv_status_accepted: "پذیرفته شده",
    inv_status_declined: "رد شده",
    inv_status_cancelled:"لغو شده",
    cancel_inv:          "لغو",
    pending_invitations: "در انتظار",
  },
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--ok)",
  medium: "var(--warn)",
  high: "var(--danger)",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--text-4)",
  collecting: "var(--ok)",
  waiting_client: "var(--warn)",
  needs_review: "var(--warn)",
  ready_to_file: "var(--ok)",
  filed: "var(--ok)",
  completed: "var(--ok)",
  blocked: "var(--danger)",
  deactivated: "var(--ink-4)",
};

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "var(--warn-subtle)",  color: "var(--warn-text)"  },
  accepted:  { bg: "var(--ok-subtle)",    color: "var(--ok-text)"    },
  declined:  { bg: "var(--danger-subtle)", color: "var(--danger-text)" },
  cancelled: { bg: "var(--bg-3)",         color: "var(--text-4)"     },
};

const ISSUE_LABEL: Record<"high_risk" | "needs_review" | "waiting_client", Record<"en" | "nl" | "fa", string>> = {
  high_risk:      { en: "High risk / Blocked", nl: "Hoog risico",       fa: "ریسک بالا"        },
  needs_review:   { en: "Needs review",        nl: "Beoordeling nodig", fa: "نیاز به بررسی"     },
  waiting_client: { en: "Waiting on client",   nl: "Wacht op klant",    fa: "منتظر مشتری"      },
};

export default function AccountantPortalPage() {
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";
  const tx = TX[lang];

  useEffect(() => {
    if (!user || loading) return;
    if (user.role !== "accountant" && !user.is_admin) {
      navigate("/client", { replace: true });
    }
  }, [user, loading, navigate]);

  const [tab, setTab] = useState<"clients" | "engagements" | "invitations">("clients");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [engagements, setEngagements] = useState<TaxEngagement[]>([]);
  const [invitations, setInvitations] = useState<PortalInvitation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Add client form state
  const [showAddClient, setShowAddClient] = useState(false);
  const [addForm, setAddForm] = useState<{ email: string; first_name: string; last_name: string; client_type: ClientType; preferred_language: "nl" | "en" | "fa"; notes: string }>({ email: "", first_name: "", last_name: "", client_type: "other", preferred_language: "nl", notes: "" });
  const [addSaving, setAddSaving] = useState(false);

  // Invitation form state
  const [invEmail, setInvEmail] = useState("");
  const [invMessage, setInvMessage] = useState("");
  const [invSending, setInvSending] = useState(false);

  // Upgrade gate state
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [actioningClient, setActioningClient] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    void loadData();
    const id = setInterval(() => void loadData(true), 20_000);
    return () => clearInterval(id);
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData(silent = false) {
    if (!silent) setLoadingData(true);
    try {
      const [cls, engs, invs] = await Promise.all([fetchClients(), fetchEngagements(), fetchPortalInvitations()]);
      setClients(cls);
      setEngagements(engs);
      setInvitations(invs);
      setLastUpdated(new Date());
    } catch {
      if (!silent) setError("Failed to load portal data");
    }
    if (!silent) setLoadingData(false);
  }

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    setInvSending(true);
    try {
      const result = await sendPortalInvitation({
        email:              invEmail.trim(),
        message:            invMessage.trim(),
        preferred_language: lang,
      });
      setInvitations(prev => [result, ...prev]);
      setInvEmail("");
      setInvMessage("");
      showToast(tx.invite_sent, "success");
      if (result.accept_url && navigator.clipboard) {
        try {
          const fullUrl = `${window.location.origin}${result.accept_url}`;
          await navigator.clipboard.writeText(fullUrl);
          showToast(
            lang === "nl"
              ? "Uitnodigingslink gekopieerd! Een e-mail is verzonden."
              : lang === "fa"
              ? "لینک دعوت کپی شد! یک ایمیل ارسال شده است."
              : "Invite link copied! An email has been sent.",
            "success"
          );
        } catch { /* clipboard not available */ }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation";
      showToast(msg.includes("already exists") ? tx.invite_error_dup : msg, "error");
    } finally {
      setInvSending(false);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      const newClient = await createClient({ ...addForm });
      setClients(prev => [newClient, ...prev]);
      setAddForm({ email: "", first_name: "", last_name: "", client_type: "other", preferred_language: "nl", notes: "" });
      setShowAddClient(false);
      showToast(lang === "nl" ? "Klant toegevoegd!" : lang === "fa" ? "مشتری اضافه شد!" : "Client added!", "success");
      navigate(`/accountant/clients/${newClient.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add client";
      // Detect 402 plan-limit response
      try {
        const parsed = JSON.parse(msg) as { detail?: string; upgrade_required?: boolean };
        if (parsed.upgrade_required) {
          setUpgradeReason(parsed.detail ?? "You have reached your client limit. Upgrade your plan to add more clients.");
          setShowUpgrade(true);
          return;
        }
      } catch { /* not JSON — fall through to toast */ }
      showToast(msg, "error");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleCancelInvitation(id: number) {
    try {
      await cancelPortalInvitation(id);
      setInvitations(prev =>
        prev.map(inv => inv.id === id ? { ...inv, status: "cancelled" as const } : inv)
      );
    } catch {
      showToast("Failed to cancel invitation.", "error");
    }
  }

  const totalClients      = clients.length;
  const readyToFile       = engagements.filter(e => e.status === "ready_to_file").length;
  const needsReview       = engagements.filter(e => e.status === "needs_review").length;
  const highRisk          = engagements.filter(e => e.risk_level === "high").length;
  const pendingInvCount   = invitations.filter(i => i.status === "pending").length;

  const priorities = [
    ...engagements.filter(e => e.status === "blocked" || e.risk_level === "high").map(e => ({ name: e.client_profile_display, issue: "high_risk" as const, id: e.id })),
    ...engagements.filter(e => e.status === "needs_review").map(e => ({ name: e.client_profile_display, issue: "needs_review" as const, id: e.id })),
    ...engagements.filter(e => e.status === "waiting_client").map(e => ({ name: e.client_profile_display, issue: "waiting_client" as const, id: e.id })),
  ].slice(0, 5);

  if (loading) return null;

  if (!user) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--ink-3)", marginBottom: 16 }}>{tx.login_required}</p>
          <button className="btn btn-accent" onClick={() => navigate("/login")}>{tx.login_btn} →</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "var(--sp-5) var(--sp-4)" : "var(--sp-9) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <span className="pill pill-accent" style={{ marginBottom: "var(--sp-2)", display: "inline-block" }}>{tx.badge}</span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              {tx.title}
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginTop: "var(--sp-1)" }}>{tx.subtitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 4 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {lang === "nl" ? "bijgewerkt" : lang === "fa" ? "به‌روز شد" : "updated"} {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => void loadData(true)}
              title="Refresh"
              style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", padding: "4px 8px", display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "var(--sp-3)", marginBottom: "var(--sp-5)" }}>
          {[
            { label: tx.total_clients, value: totalClients, icon: <Users size={15} />,         iconColor: "var(--blue)",        iconBg: "var(--blue-subtle)"   },
            { label: tx.ready,         value: readyToFile,  icon: <CheckCircle2 size={15} />,  iconColor: "var(--ok-text)",     iconBg: "var(--ok-subtle)"     },
            { label: tx.needs_review,  value: needsReview,  icon: <AlertCircle size={15} />,   iconColor: "var(--warn-text)",   iconBg: "var(--warn-subtle)"   },
            { label: tx.urgent,        value: highRisk,     icon: <AlertTriangle size={15} />, iconColor: "var(--danger-text)", iconBg: "var(--danger-subtle)" },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: "var(--sp-5)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: card.iconColor, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 2 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Waiting for review banner ── */}
        {!loadingData && clients.filter(c => c.latest_engagement_status === "needs_review").length > 0 && (
          <div style={{
            background: "var(--warn-subtle)",
            border: "1px solid var(--warn)",
            borderRadius: "var(--r)",
            padding: "var(--sp-4) var(--sp-5)",
            marginBottom: "var(--sp-5)",
          }}>
            <div style={{ fontWeight: 700, color: "var(--warn-text)", marginBottom: "var(--sp-2)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⏳</span>
              {lang === "nl" ? "Wacht op uw beoordeling" : lang === "fa" ? "منتظر بررسی شما" : "Waiting for your review"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {clients
                .filter(c => c.latest_engagement_status === "needs_review")
                .map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "var(--sp-2) var(--sp-4)" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>
                      {c.display_name || c.email}
                    </span>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => navigate(`/accountant/engagements/${c.latest_engagement_id}?tab=review`)}
                    >
                      {lang === "nl" ? "Beoordelen →" : lang === "fa" ? "بررسی ←" : "Review →"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Priority Actions */}
        {!loadingData && priorities.length > 0 && (
          <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--sp-3) var(--sp-5)", borderBottom: "1px solid var(--hairline)" }}>
              <Zap size={13} style={{ color: "var(--blue)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>
                {lang === "nl" ? "Prioritaire acties" : lang === "fa" ? "اقدامات اولویت‌دار" : "Priority Actions"}
              </span>
              <span style={{ marginInlineStart: "auto", fontSize: 11, color: "var(--ink-4)" }}>
                {priorities.length} {lang === "fa" ? "مورد" : "items"}
              </span>
            </div>
            {priorities.map((item, i) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-3) var(--sp-5)", borderBottom: i < priorities.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.issue === "high_risk" ? "var(--danger)" : "var(--warn)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink)" }}>{item.name}</span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{ISSUE_LABEL[item.issue][lang]}</span>
                </div>
                <Link to={`/accountant/engagements/${item.id}`} style={{ display: "flex", alignItems: "center", color: "var(--ink-4)", flexShrink: 0, padding: 4 }}>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {error && <div className="card" style={{ padding: "var(--sp-3)", background: "var(--danger-subtle)", color: "var(--danger-text)", marginBottom: "var(--sp-4)", fontSize: "var(--text-sm)" }}>{error}</div>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-5)", borderBottom: "1px solid var(--hairline)", paddingBottom: "var(--sp-2)", flexWrap: "wrap" }}>
          {(["clients", "engagements", "invitations"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "2px solid var(--blue)" : "none", borderRadius: 0, display: "flex", alignItems: "center", gap: 6 }}
            >
              {t === "clients" ? tx.clients_tab : t === "engagements" ? tx.engagements_tab : tx.invitations_tab}
              {t === "invitations" && pendingInvCount > 0 && (
                <span style={{ padding: "1px 7px", borderRadius: 99, background: "var(--warn)", color: "var(--bg)", fontSize: 11, fontWeight: 700 }}>
                  {pendingInvCount}
                </span>
              )}
            </button>
          ))}
          {tab === "clients" && (
            <button
              className="btn btn-accent btn-sm"
              style={{ marginInlineStart: "auto" }}
              onClick={() => setShowAddClient(s => !s)}
            >
              {tx.add_client}
            </button>
          )}
          {tab !== "clients" && <div style={{ marginInlineStart: "auto" }} />}
        </div>

        {/* Add Client form */}
        {tab === "clients" && showAddClient && (
          <div className="card" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-4)" }}>
            <form onSubmit={handleAddClient} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)" }}>
                <div>
                  <label className="tw-label">{tx.email_label} *</label>
                  <input type="email" required className="tw-input" style={{ width: "100%", fontSize: 16 }}
                    value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="tw-label">{tx.first_name_label}</label>
                  <input type="text" className="tw-input" style={{ width: "100%", fontSize: 16 }}
                    value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="tw-label">{tx.last_name_label}</label>
                  <input type="text" className="tw-input" style={{ width: "100%", fontSize: 16 }}
                    value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div>
                  <label className="tw-label">{tx.type_label}</label>
                  <select className="tw-input" style={{ width: "100%", fontSize: 16 }}
                    value={addForm.client_type} onChange={e => setAddForm(f => ({ ...f, client_type: e.target.value as ClientType }))}>
                    <option value="employee">Employee</option>
                    <option value="zzp">ZZP / Freelancer</option>
                    <option value="expat">Expat</option>
                    <option value="dga">DGA / Director</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="tw-label">{tx.lang_label}</label>
                  <select className="tw-input" style={{ width: "100%", fontSize: 16 }}
                    value={addForm.preferred_language} onChange={e => setAddForm(f => ({ ...f, preferred_language: e.target.value as "nl" | "en" | "fa" }))}>
                    <option value="nl">Nederlands</option>
                    <option value="en">English</option>
                    <option value="fa">فارسی</option>
                  </select>
                </div>
                <div>
                  <label className="tw-label">{tx.notes_label}</label>
                  <textarea className="tw-input" style={{ width: "100%", fontSize: 16, resize: "vertical", minHeight: 60 }}
                    value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                <button type="submit" className="btn btn-accent" disabled={addSaving}>{addSaving ? "…" : tx.add_btn}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddClient(false)}>{tx.cancel}</button>
              </div>
            </form>
          </div>
        )}

        {/* Tab content — wrapped in a local error boundary so any render crash
            shows an inline Retry instead of the global "Something went wrong" */}
        <TabErrorBoundary onReset={() => void loadData(true)}>

        {/* Client table */}
        {tab === "clients" && (
          loadingData ? (
            <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</div>
          ) : clients.length === 0 ? (
            <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>{tx.no_clients}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--hairline)", textAlign: "start" }}>
                    {["Client", tx.type, tx.lang_label, tx.status, tx.readiness, "Missing", tx.risk, ""].map(h => (
                      <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    const isDeactivated = c.status === "deactivated";
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)", opacity: isDeactivated ? 0.5 : 1, background: isDeactivated ? "var(--warn-subtle)" : undefined, transition: "opacity 0.3s, background 0.3s" }}>
                        <td style={{ padding: "var(--sp-3)", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--ink)" }}>{c.display_name}</span>
                            {isDeactivated && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", background: "var(--warn-subtle)", border: "1px solid var(--warn-border)", padding: "1px 6px", borderRadius: 99, textTransform: "uppercase" }}>
                                {lang === "nl" ? "Losgekoppeld" : lang === "fa" ? "قطع شده" : "Disconnected"}
                              </span>
                            )}
                            {!isDeactivated && c.client_user === null && c.status === "invited" && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn-text)", background: "var(--warn-subtle)", border: "1px solid var(--warn-border)", padding: "1px 6px", borderRadius: 99, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                {lang === "nl" ? "⏳ Wacht op acceptatie" : lang === "fa" ? "⏳ در انتظار پذیرش" : "⏳ Awaiting acceptance"}
                              </span>
                            )}
                          </div>
                          <div style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)" }}>{c.email}</div>
                          {isDeactivated && c.days_until_deletion !== null && (
                            <div style={{ color: "var(--warn-text, #7a5a00)", fontSize: "var(--text-2xs)", marginTop: 2 }}>
                              {lang === "nl"
                                ? `Verwijderd over ${c.days_until_deletion ?? 0} dagen`
                                : lang === "fa"
                                ? `حذف در ${c.days_until_deletion ?? 0} روز`
                                : `Deleted in ${c.days_until_deletion ?? 0}d`}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "var(--sp-3)" }}>
                          <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{(c.client_type || "other").toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "var(--sp-3)", color: "var(--ink-3)" }}>{(c.preferred_language || "nl").toUpperCase()}</td>
                        <td style={{ padding: "var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[c.status] || "var(--ink-3)" }}>{getClientStatusLabel(c.status, lang)}</span>
                        </td>
                        <td style={{ padding: "var(--sp-3)", textAlign: "center" }}>
                          {!isDeactivated && c.latest_readiness !== null ? (
                            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: c.latest_readiness >= 85 ? "var(--ok)" : c.latest_readiness >= 50 ? "var(--warn)" : "var(--danger)" }}>
                              {c.latest_readiness}%
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "var(--sp-3)", textAlign: "center", color: c.latest_missing_count > 0 ? "var(--danger)" : "var(--ok)" }}>
                          {c.latest_missing_count > 0 ? c.latest_missing_count : "—"}
                        </td>
                        <td style={{ padding: "var(--sp-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: RISK_COLOR[c.latest_risk_level] }}>{c.latest_risk_level}</span>
                        </td>
                        <td style={{ padding: "var(--sp-3)" }}>
                          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                            <Link to={`/accountant/clients/${c.id}`} className="btn btn-ghost btn-sm">{tx.view_client} →</Link>
                            {!isDeactivated ? (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: "var(--warn-text, #7a5a00)", display: "inline-flex", alignItems: "center" }}
                                title="Disconnect client (30-day grace period)"
                                disabled={actioningClient === c.id}
                                onClick={async () => {
                                  if (!window.confirm(`Disconnect ${c.display_name}? Their data is kept for 30 days.`)) return;
                                  setActioningClient(c.id);
                                  try {
                                    await disconnectClient(c.id);
                                    void loadData(true);
                                  } catch {
                                    showToast(
                                      lang === "nl" ? "Loskoppelen mislukt. Probeer opnieuw."
                                      : lang === "fa" ? "قطع اتصال ناموفق بود. دوباره امتحان کنید."
                                      : "Disconnect failed. Please try again.",
                                      "error"
                                    );
                                  } finally {
                                    setActioningClient(null);
                                  }
                                }}
                              >{actioningClient === c.id ? "…" : <X size={13} />}</button>
                            ) : (
                              <button
                                className="btn btn-accent btn-sm"
                                style={{ fontSize: "var(--text-2xs)" }}
                                disabled={actioningClient === c.id}
                                onClick={async () => {
                                  setActioningClient(c.id);
                                  try {
                                    await reactivateClient(c.id);
                                    void loadData(true);
                                  } catch {
                                    showToast(
                                      lang === "nl" ? "Reactiveren mislukt. Probeer opnieuw."
                                      : lang === "fa" ? "فعال‌سازی مجدد ناموفق بود. دوباره امتحان کنید."
                                      : "Reactivation failed. Please try again.",
                                      "error"
                                    );
                                  } finally {
                                    setActioningClient(null);
                                  }
                                }}
                              >{actioningClient === c.id ? "…" : (lang === "nl" ? "Reactiveer" : lang === "fa" ? "فعال‌سازی مجدد" : "Reactivate")}</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Engagements table */}
        {tab === "engagements" && (
          loadingData ? (
            <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</div>
          ) : engagements.length === 0 ? (
            <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>{tx.no_engagements}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--hairline)" }}>
                    {["Client", "Year", "Type", tx.status, tx.readiness, tx.risk, ""].map(h => (
                      <th key={h} style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--ink-3)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "start" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engagements.map(eng => (
                    <tr key={eng.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "var(--sp-3)", fontWeight: 500 }}>{eng.client_profile_display}</td>
                      <td style={{ padding: "var(--sp-3)", color: "var(--ink-3)" }}>{eng.tax_year}</td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{ENGAGEMENT_TYPE_LABELS[eng.engagement_type] ?? eng.engagement_type}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[eng.status] || "var(--ink-3)" }}>{getEngagementStatusLabel(eng.status, lang)}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)", textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: eng.readiness_score >= 85 ? "var(--ok)" : eng.readiness_score >= 50 ? "var(--warn)" : "var(--danger)" }}>
                          {eng.readiness_score}%
                        </span>
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: RISK_COLOR[eng.risk_level] }}>{eng.risk_level}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <Link to={`/accountant/engagements/${eng.id}`} className="btn btn-ghost btn-sm">{tx.open_eng} →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {/* ── Invitations tab ─────────────────────────────────────────────── */}
        {tab === "invitations" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.6fr", gap: "var(--sp-6)", alignItems: "start" }}>

            {/* Send invitation form */}
            <div className="card" style={{ padding: "var(--sp-5)" }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-4)" }}>
                {tx.invite_title}
              </h3>
              <form onSubmit={handleSendInvitation} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                <div>
                  <label className="tw-label">{tx.invite_email} *</label>
                  <input
                    type="email" required className="tw-input"
                    style={{ width: "100%", fontSize: 16 }}
                    value={invEmail}
                    onChange={e => setInvEmail(e.target.value)}
                    placeholder="client@example.nl"
                  />
                </div>
                <div>
                  <label className="tw-label">{tx.invite_message}</label>
                  <textarea
                    className="tw-input"
                    style={{ width: "100%", minHeight: 72, fontSize: 16, resize: "vertical" }}
                    value={invMessage}
                    onChange={e => setInvMessage(e.target.value)}
                    placeholder={lang === "nl" ? "Bijv. Ik ben uw nieuwe belastingadviseur…" : lang === "fa" ? "مثلاً: من مشاور مالیاتی جدید شما هستم…" : "e.g. I'm your new tax advisor for 2026…"}
                  />
                </div>
                <button type="submit" className="btn btn-accent" disabled={invSending} style={{ marginTop: "var(--sp-1)" }}>
                  {invSending ? "…" : tx.invite_btn}
                </button>
              </form>
            </div>

            {/* Sent invitations list */}
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-4)" }}>
                {tx.invitations_tab}
              </h3>
              {invitations.length === 0 ? (
                <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)", fontSize: "var(--text-sm)" }}>
                  {tx.no_invitations}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {invitations.map(inv => {
                    const chip = STATUS_CHIP[inv.status] ?? STATUS_CHIP.pending;
                    const statusLabel = (tx as Record<string, string>)[`inv_status_${inv.status}`] ?? inv.status;
                    const fullAcceptUrl = inv.accept_url ? `${window.location.origin}${inv.accept_url}` : null;
                    return (
                      <div key={inv.id} className="card" style={{ padding: "var(--sp-4)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.client_name || inv.client_email}
                          </div>
                          {inv.client_name && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{inv.client_email}</div>
                          )}
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 4 }}>{inv.created_at}</div>
                          {inv.status === "pending" && fullAcceptUrl && (
                            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                                {fullAcceptUrl}
                              </span>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 10, padding: "2px 8px", flexShrink: 0 }}
                                onClick={() => {
                                  navigator.clipboard.writeText(fullAcceptUrl).then(() =>
                                    showToast(lang === "nl" ? "Link gekopieerd" : lang === "fa" ? "لینک کپی شد" : "Link copied", "success")
                                  );
                                }}
                              >
                                {lang === "nl" ? "Kopiëren" : lang === "fa" ? "کپی" : "Copy"}
                              </button>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: chip.bg, color: chip.color }}>
                            {statusLabel}
                          </span>
                          {inv.status === "pending" && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 11, color: "var(--ink-4)" }}
                              onClick={() => handleCancelInvitation(inv.id)}
                            >
                              {tx.cancel_inv}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        </TabErrorBoundary>

      </div>

      {/* Plan upgrade gate */}
      {showUpgrade && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "oklch(0 0 0 / 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowUpgrade(false)}
        >
          <div
            style={{
              background: "var(--paper)", borderRadius: 16, padding: 32,
              maxWidth: 420, width: "100%", boxShadow: "var(--sh-lg)",
              textAlign: "center",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>⬆️</div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: 8 }}>
              {lang === "nl" ? "Plan limiet bereikt" : lang === "fa" ? "محدودیت پلن" : "Plan limit reached"}
            </h2>
            <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginBottom: 24 }}>
              {upgradeReason}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowUpgrade(false)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border-2)", background: "transparent", cursor: "pointer", fontSize: "var(--text-sm)" }}
              >
                {lang === "nl" ? "Annuleren" : lang === "fa" ? "لغو" : "Cancel"}
              </button>
              <button
                onClick={() => { setShowUpgrade(false); navigate("/pricing"); }}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600 }}
              >
                {lang === "nl" ? "Upgrade plan" : lang === "fa" ? "ارتقاء پلن" : "Upgrade plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
