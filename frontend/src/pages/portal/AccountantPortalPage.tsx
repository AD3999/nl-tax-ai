import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import {
  fetchClients, fetchEngagements, createClient,
} from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";

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
  },
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--sage-600)",
  medium: "oklch(0.62 0.13 50)",
  high: "var(--danger)",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--ink-4)",
  collecting: "var(--sage-600)",
  waiting_client: "oklch(0.62 0.13 50)",
  needs_review: "oklch(0.62 0.13 50)",
  ready_to_file: "var(--sage-600)",
  filed: "var(--sage-600)",
  completed: "var(--sage-600)",
  blocked: "var(--danger)",
};

export default function AccountantPortalPage() {
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";
  const tx = TX[lang];

  const [tab, setTab] = useState<"clients" | "engagements">("clients");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [engagements, setEngagements] = useState<TaxEngagement[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", client_type: "zzp", preferred_language: "nl", notes: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    loadData();
  }, [user, loading]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [cls, engs] = await Promise.all([fetchClients(), fetchEngagements()]);
      setClients(cls);
      setEngagements(engs);
    } catch {
      setError("Failed to load portal data");
    }
    setLoadingData(false);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      await createClient({
        ...form,
        client_type: form.client_type as import("../../api/portal/types").ClientType,
        preferred_language: form.preferred_language as "nl" | "en" | "fa",
      });
      setForm({ email: "", first_name: "", last_name: "", client_type: "zzp", preferred_language: "nl", notes: "" });
      setShowAdd(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding client");
    }
    setAdding(false);
  }

  const totalClients = clients.length;
  const waitingClient = engagements.filter(e => e.status === "waiting_client").length;
  const needsReview   = engagements.filter(e => e.status === "needs_review").length;
  const readyToFile   = engagements.filter(e => e.status === "ready_to_file").length;

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
        <div style={{ marginBottom: "var(--sp-6)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-2)", display: "inline-block" }}>{tx.badge}</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
            {tx.title}
          </h1>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginTop: "var(--sp-1)" }}>{tx.subtitle}</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
          {[
            { label: tx.total_clients, value: totalClients, color: "var(--sage-600)" },
            { label: tx.waiting,       value: waitingClient, color: "oklch(0.62 0.13 50)" },
            { label: tx.needs_review,  value: needsReview,   color: "oklch(0.62 0.13 50)" },
            { label: tx.ready,         value: readyToFile,   color: "var(--sage-600)" },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: "var(--sp-4)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--text-3xl)", fontFamily: "var(--serif)", color: card.color, fontWeight: 400 }}>{card.value}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: "var(--sp-1)" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {error && <div className="card" style={{ padding: "var(--sp-3)", background: "oklch(0.95 0.03 25)", color: "var(--danger)", marginBottom: "var(--sp-4)", fontSize: "var(--text-sm)" }}>{error}</div>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-5)", borderBottom: "1px solid var(--hairline)", paddingBottom: "var(--sp-2)" }}>
          {(["clients", "engagements"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "2px solid var(--sage-600)" : "none", borderRadius: 0 }}
            >
              {t === "clients" ? tx.clients_tab : tx.engagements_tab}
            </button>
          ))}
          <div style={{ marginInlineStart: "auto" }}>
            {tab === "clients" && (
              <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(s => !s)}>{tx.add_client}</button>
            )}
          </div>
        </div>

        {/* Add client form */}
        {showAdd && tab === "clients" && (
          <div className="card" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-4)" }}>
            <form onSubmit={handleAddClient}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
                <div>
                  <label className="tw-label">{tx.email_label} *</label>
                  <input type="email" required className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="tw-label">{tx.first_name_label}</label>
                  <input type="text" className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="tw-label">{tx.last_name_label}</label>
                  <input type="text" className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
                <div>
                  <label className="tw-label">{tx.type_label}</label>
                  <select className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.client_type} onChange={e => setForm(f => ({ ...f, client_type: e.target.value }))}>
                    {["zzp", "employee", "expat", "dga", "other"].map(ct => (
                      <option key={ct} value={ct}>{ct.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="tw-label">{tx.lang_label}</label>
                  <select className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.preferred_language} onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}>
                    <option value="nl">Nederlands</option>
                    <option value="en">English</option>
                    <option value="fa">فارسی</option>
                  </select>
                </div>
                <div>
                  <label className="tw-label">{tx.notes_label}</label>
                  <input type="text" className="tw-input" style={{ width: "100%", fontSize: 16 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                <button type="submit" className="btn btn-accent btn-sm" disabled={adding}>{adding ? "..." : tx.add_btn}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>{tx.cancel}</button>
              </div>
            </form>
          </div>
        )}

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
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: c.latest_readiness >= 85 ? "var(--sage-600)" : c.latest_readiness >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)" }}>
                            {c.latest_readiness}%
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "var(--sp-3)", textAlign: "center", color: "var(--ink-3)" }}>
                        {c.engagement_count > 0 ? "—" : "—"}
                      </td>
                      <td style={{ padding: "var(--sp-3)" }}>—</td>
                      <td style={{ padding: "var(--sp-3)" }}>
                        <Link to={`/accountant/clients/${c.id}`} className="btn btn-ghost btn-sm">{tx.view_client} →</Link>
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
                        <span style={{ fontWeight: 600, color: eng.readiness_score >= 85 ? "var(--sage-600)" : eng.readiness_score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)" }}>
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
      </div>
    </main>
  );
}
