import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Clock, AlertCircle, MailOpen, ArrowRight, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import {
  fetchClients, fetchEngagements, archiveClient,
} from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";
import {
  fetchSentInvitations, sendInvitation, cancelInvitation,
  type SentInvitation,
} from "../../api/invitations";
import { useToast } from "../../context/ToastContext";

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

  const [tab, setTab] = useState<"clients" | "engagements" | "invitations">("clients");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [engagements, setEngagements] = useState<TaxEngagement[]>([]);
  const [invitations, setInvitations] = useState<SentInvitation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Invitation form state
  const [invEmail, setInvEmail] = useState("");
  const [invMessage, setInvMessage] = useState("");
  const [invSending, setInvSending] = useState(false);

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
      const [cls, engs, invs] = await Promise.all([fetchClients(), fetchEngagements(), fetchSentInvitations()]);
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
      const inv = await sendInvitation(invEmail.trim(), invMessage.trim());
      setInvitations(prev => [inv, ...prev]);
      setInvEmail("");
      setInvMessage("");
      showToast(tx.invite_sent, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation";
      showToast(msg.includes("already exists") ? tx.invite_error_dup : msg, "error");
    } finally {
      setInvSending(false);
    }
  }

  async function handleCancelInvitation(id: number) {
    await cancelInvitation(id);
    setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status: "cancelled" as const } : inv));
  }

  const totalClients      = clients.length;
  const waitingClient     = engagements.filter(e => e.status === "waiting_client").length;
  const needsReview       = engagements.filter(e => e.status === "needs_review").length;
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
              style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", fontSize: 14, padding: "3px 8px", lineHeight: 1 }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "var(--sp-3)", marginBottom: "var(--sp-5)" }}>
          {[
            { label: tx.total_clients,       value: totalClients,    icon: <Users size={15} />,       iconColor: "var(--blue)",        iconBg: "var(--blue-subtle)"   },
            { label: tx.waiting,             value: waitingClient,   icon: <Clock size={15} />,       iconColor: "var(--warn-text)",   iconBg: "var(--warn-subtle)"   },
            { label: tx.needs_review,        value: needsReview,     icon: <AlertCircle size={15} />, iconColor: "var(--danger-text)", iconBg: "var(--danger-subtle)" },
            { label: tx.pending_invitations, value: pendingInvCount, icon: <MailOpen size={15} />,    iconColor: "var(--blue)",        iconBg: "var(--blue-subtle)"   },
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
          <div style={{ marginInlineStart: "auto" }} />
        </div>

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
                  {clients.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "var(--sp-3)", fontWeight: 500 }}>
                        <div style={{ color: "var(--ink)" }}>{c.display_name}</div>
                        <div style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)" }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{c.client_type.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)", color: "var(--ink-3)" }}>{c.preferred_language.toUpperCase()}</td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[c.status] || "var(--ink-3)" }}>{c.status}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)", textAlign: "center" }}>
                        {c.latest_readiness !== null ? (
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: c.latest_readiness >= 85 ? "var(--ok)" : c.latest_readiness >= 50 ? "var(--warn)" : "var(--danger)" }}>
                            {c.latest_readiness}%
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "var(--sp-3)", textAlign: "center", color: "var(--ink-3)" }}>
                        {c.engagement_count > 0 ? "—" : "—"}
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>—</td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                          <Link to={`/accountant/clients/${c.id}`} className="btn btn-ghost btn-sm">{tx.view_client} →</Link>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--danger)" }}
                            onClick={async () => {
                              if (!window.confirm(`Remove ${c.display_name}?`)) return;
                              await archiveClient(c.id);
                              setClients(prev => prev.filter(x => x.id !== c.id));
                            }}
                          >✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                        <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{eng.engagement_type}</span>
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[eng.status] || "var(--ink-3)" }}>{eng.status}</span>
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
                    return (
                      <div key={inv.id} className="card" style={{ padding: "var(--sp-4)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.client_name || inv.invited_email}
                          </div>
                          {inv.client_name && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{inv.invited_email}</div>
                          )}
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 4 }}>{inv.created_at}</div>
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

      </div>
    </main>
  );
}
