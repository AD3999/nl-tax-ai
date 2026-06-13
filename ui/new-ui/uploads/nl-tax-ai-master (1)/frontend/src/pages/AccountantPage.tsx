import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { apiBase, authHeader } from "../api/client";

type ClientSummary = {
  id: number;
  nickname: string;
  user_type: string | null;
  alert_count: number;
  created_at: string;
};

type ClientDetail = {
  id: number;
  nickname: string;
  notes: string;
  user_type: string | null;
  alerts: Array<{ id: string; title: string; severity: string; category: string }>;
  upcoming_reminders: Array<{ title: string; due_date: string; category: string }>;
};

const TX: Record<string, Record<string, string>> = {
  en: {
    title: "Accountant Dashboard",
    subtitle: "Manage your clients and their upcoming tax obligations",
    badge: "Accountant",
    login_required: "Log in to access the accountant dashboard",
    clients_title: "Your clients",
    add_client: "Add client",
    email_label: "Client email address",
    nickname_label: "Nickname (optional)",
    notes_label: "Notes",
    add_btn: "Add",
    cancel: "Cancel",
    no_clients: "No clients yet — add your first client above",
    alerts: "Alerts",
    reminders: "Upcoming deadlines",
    close: "Close",
    remove: "Remove",
    view: "View",
    user_type_label: "Type",
    since: "Since",
  },
  nl: {
    title: "Accountant Dashboard",
    subtitle: "Beheer uw klanten en hun aankomende belastingverplichtingen",
    badge: "Accountant",
    login_required: "Log in om het accountant dashboard te bekijken",
    clients_title: "Uw klanten",
    add_client: "Klant toevoegen",
    email_label: "E-mailadres klant",
    nickname_label: "Naam (optioneel)",
    notes_label: "Notities",
    add_btn: "Toevoegen",
    cancel: "Annuleren",
    no_clients: "Nog geen klanten — voeg uw eerste klant hierboven toe",
    alerts: "Meldingen",
    reminders: "Aankomende deadlines",
    close: "Sluiten",
    remove: "Verwijderen",
    view: "Bekijken",
    user_type_label: "Type",
    since: "Sinds",
  },
  fa: {
    title: "داشبورد حسابدار",
    subtitle: "مشتریان و تکالیف مالیاتی آینده آن‌ها را مدیریت کنید",
    badge: "حسابدار",
    login_required: "برای دسترسی به داشبورد حسابدار وارد شوید",
    clients_title: "مشتریان شما",
    add_client: "افزودن مشتری",
    email_label: "آدرس ایمیل مشتری",
    nickname_label: "نام مستعار (اختیاری)",
    notes_label: "یادداشت‌ها",
    add_btn: "افزودن",
    cancel: "لغو",
    no_clients: "هنوز هیچ مشتری‌ای وجود ندارد — اولین مشتری خود را اضافه کنید",
    alerts: "هشدارها",
    reminders: "مهلت‌های پیش‌رو",
    close: "بستن",
    remove: "حذف",
    view: "مشاهده",
    user_type_label: "نوع",
    since: "از",
  },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--danger)",
  warning: "oklch(0.62 0.13 50)",
  info: "var(--sage-600)",
};

export default function AccountantPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (i18n.language === "nl" || i18n.language === "fa") ? i18n.language : "en";
  const tx = TX[lang];

  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addNickname, setAddNickname] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadClients();
  }, [user]);

  async function loadClients() {
    setLoading(true);
    const r = await fetch(`${apiBase}/users/accountant/clients/`, { headers: authHeader() });
    if (r.ok) setClients(await r.json());
    setLoading(false);
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch(`${apiBase}/users/accountant/clients/`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, nickname: addNickname, notes: addNotes }),
    });
    setAddEmail(""); setAddNickname(""); setAddNotes(""); setShowAdd(false);
    await loadClients();
    setAdding(false);
  }

  async function removeClient(id: number) {
    await fetch(`${apiBase}/users/accountant/clients/${id}/`, { method: "DELETE", headers: authHeader() });
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
  }

  async function viewClient(id: number) {
    setDetailLoading(true);
    const r = await fetch(`${apiBase}/users/accountant/clients/${id}/`, { headers: authHeader() });
    if (r.ok) setSelectedClient(await r.json());
    setDetailLoading(false);
  }

  if (!user) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--ink-3)", marginBottom: 16 }}>{tx.login_required}</p>
          <button className="btn btn-accent" onClick={() => navigate("/login")}>{TX.en.login_required.split(" ")[0]} →</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "var(--sp-6) var(--sp-4)" : "var(--sp-10) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-7)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>{tx.badge}</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
            {tx.title}
          </h1>
          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginTop: "var(--sp-1)" }}>{tx.subtitle}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr", gap: "var(--sp-6)", alignItems: "start" }}>

          {/* Client list */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)" }}>{tx.clients_title}</h2>
              <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(s => !s)}>
                + {tx.add_client}
              </button>
            </div>

            {/* Add client form */}
            {showAdd && (
              <div className="card" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-4)" }}>
                <form onSubmit={addClient} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  <div>
                    <label className="tw-label">{tx.email_label}</label>
                    <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} className="tw-input" style={{ width: "100%", fontSize: 16 }} required />
                  </div>
                  <div>
                    <label className="tw-label">{tx.nickname_label}</label>
                    <input type="text" value={addNickname} onChange={e => setAddNickname(e.target.value)} className="tw-input" style={{ width: "100%", fontSize: 16 }} />
                  </div>
                  <div>
                    <label className="tw-label">{tx.notes_label}</label>
                    <textarea value={addNotes} onChange={e => setAddNotes(e.target.value)} className="tw-input" style={{ width: "100%", minHeight: 60, fontSize: 16, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                    <button type="submit" className="btn btn-accent btn-sm" disabled={adding}>{adding ? "..." : tx.add_btn}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>{tx.cancel}</button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div style={{ color: "var(--ink-4)", padding: "var(--sp-6)", textAlign: "center" }}>Loading...</div>
            ) : clients.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                {tx.no_clients}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {clients.map(c => (
                  <div key={c.id} className="card" style={{ padding: "var(--sp-4)", display: "flex", justifyContent: "space-between", alignItems: "center", background: selectedClient?.id === c.id ? "var(--accent-soft)" : undefined }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-sm)" }}>{c.nickname}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
                        {c.user_type && <span style={{ marginInlineEnd: 8 }}>{c.user_type.toUpperCase()}</span>}
                        {tx.since} {c.created_at}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewClient(c.id)}>{tx.view}</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeClient(c.id)}>{tx.remove}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client detail panel */}
          <div>
            {detailLoading ? (
              <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)" }}>Loading...</div>
            ) : selectedClient ? (
              <div className="card" style={{ padding: "var(--sp-6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)" }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-2xl)", fontWeight: 400, color: "var(--ink)" }}>
                    {selectedClient.nickname}
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedClient(null)}>{tx.close}</button>
                </div>

                {selectedClient.notes && (
                  <p style={{ color: "var(--ink-3)", fontSize: "var(--text-xs)", marginBottom: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--paper-3)", borderRadius: "var(--r-sm)" }}>
                    {selectedClient.notes}
                  </p>
                )}

                <div style={{ marginBottom: "var(--sp-5)" }}>
                  <div className="eyebrow eyebrow-accent" style={{ marginBottom: "var(--sp-3)" }}>{tx.alerts}</div>
                  {selectedClient.alerts.length === 0 ? (
                    <p style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)" }}>No alerts</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                      {selectedClient.alerts.map(a => (
                        <div key={a.id} style={{ padding: "var(--sp-3)", borderRadius: "var(--r)", border: "1px solid var(--hairline)", background: "var(--paper)" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEVERITY_COLOR[a.severity] || "var(--ink-4)", display: "inline-block", marginInlineEnd: 8 }} />
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{a.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="eyebrow eyebrow-accent" style={{ marginBottom: "var(--sp-3)" }}>{tx.reminders}</div>
                  {selectedClient.upcoming_reminders.length === 0 ? (
                    <p style={{ color: "var(--ink-4)", fontSize: "var(--text-xs)" }}>No upcoming deadlines</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                      {selectedClient.upcoming_reminders.map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-3)", borderRadius: "var(--r)", border: "1px solid var(--hairline)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{r.title}</span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{r.due_date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)", fontSize: "var(--text-sm)" }}>
                Select a client to see their alerts and upcoming deadlines
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
