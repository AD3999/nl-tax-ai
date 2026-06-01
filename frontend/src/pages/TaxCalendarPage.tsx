import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMobile } from "../hooks/useMobile";
import { apiBase, authHeader } from "../api/client";

type Reminder = {
  id: number;
  title: string;
  description: string;
  category: string;
  due_date: string;
  days_until: number;
  action_type: string;
  source_url: string;
  user_types: string[];
};

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  income_tax:            { label: "Income Tax",     color: "var(--sage-600)",   icon: "📄" },
  vat:                   { label: "BTW / VAT",      color: "oklch(0.55 0.14 230)", icon: "🧾" },
  toeslagen:             { label: "Toeslagen",      color: "oklch(0.55 0.12 50)",  icon: "🏠" },
  provisional_assessment:{ label: "Voorlopige",     color: "oklch(0.52 0.13 290)", icon: "📊" },
  expat:                 { label: "Expat",          color: "oklch(0.62 0.13 50)",  icon: "✈️" },
  dga:                   { label: "DGA / BV",       color: "oklch(0.55 0.10 290)", icon: "🏢" },
  box3:                  { label: "Box 3",          color: "oklch(0.55 0.08 160)", icon: "💰" },
  zzp_admin:             { label: "ZZP Admin",      color: "var(--sage-700)",   icon: "⏱️" },
  corporate_tax:         { label: "Vpb",            color: "oklch(0.48 0.12 290)", icon: "🏭" },
  payroll:               { label: "Payroll",        color: "oklch(0.50 0.14 170)", icon: "💼" },
  dividend_tax:          { label: "Dividend",       color: "oklch(0.55 0.15 50)",  icon: "💹" },
};

const TX: Record<string, Record<string, string>> = {
  nl: {
    title: "Belastingkalender 2026",
    subtitle: "Alle deadlines en herinneringen op één plek",
    badge: "Smart kalender",
    loading: "Reminders laden...",
    empty: "Geen aankomende reminders gevonden",
    days_until: "over {{n}} dag(en)",
    today: "Vandaag",
    past: "Verlopen",
    source: "Bron",
    add_google: "Toevoegen aan Google Calendar",
    download_ics: "Download .ics (Apple / Outlook)",
    filter_all: "Alle",
    ask_ai: "Vraag de AI →",
    categories: "Categorieën",
  },
  en: {
    title: "Tax Calendar 2026",
    subtitle: "All deadlines and reminders in one place",
    badge: "Smart calendar",
    loading: "Loading reminders...",
    empty: "No upcoming reminders found",
    days_until: "in {{n}} day(s)",
    today: "Today",
    past: "Overdue",
    source: "Source",
    add_google: "Add to Google Calendar",
    download_ics: "Download .ics (Apple / Outlook)",
    filter_all: "All",
    ask_ai: "Ask the AI →",
    categories: "Categories",
  },
  fa: {
    title: "تقویم مالیاتی ۲۰۲۶",
    subtitle: "تمام مهلت‌ها و یادآوری‌ها در یک مکان",
    badge: "تقویم هوشمند",
    loading: "در حال بارگذاری یادآوری‌ها...",
    empty: "یادآوری آینده‌ای یافت نشد",
    days_until: "{{n}} روز دیگر",
    today: "امروز",
    past: "منقضی",
    source: "منبع",
    add_google: "افزودن به Google Calendar",
    download_ics: "دانلود .ics (Apple / Outlook)",
    filter_all: "همه",
    ask_ai: "از هوش مصنوعی بپرس ←",
    categories: "دسته‌بندی‌ها",
  },
};

function daysLabel(days: number, tx: Record<string, string>): { text: string; urgent: boolean } {
  if (days === 0) return { text: tx.today, urgent: true };
  if (days < 0) return { text: tx.past, urgent: true };
  return {
    text: tx.days_until.replace("{{n}}", String(days)),
    urgent: days <= 7,
  };
}

export default function TaxCalendarPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (i18n.language === "nl" || i18n.language === "fa") ? i18n.language : "en";
  const tx = TX[lang];

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/users/reminders/?lang=${lang}&days=366`, {
      headers: authHeader(),
    })
      .then(r => r.json())
      .then((data: Reminder[]) => { setReminders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lang]);

  const categories = ["all", ...Array.from(new Set(reminders.map(r => r.category)))];

  const filtered = filter === "all" ? reminders : reminders.filter(r => r.category === filter);

  const icsUrl = `${apiBase}/users/calendar.ics`;
  const googleUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(window.location.origin + "/api/users/calendar.ics")}`;

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "var(--sp-6) var(--sp-4)" : "var(--sp-10) var(--sp-8)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-6)" }}>
          <span className="pill pill-accent" style={{ marginBottom: "var(--sp-3)", display: "inline-block" }}>{tx.badge}</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: "var(--sp-3)" }}>
            <div>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-4xl)", fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.025em" }}>
                {tx.title}
              </h1>
              <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", marginTop: "var(--sp-1)" }}>{tx.subtitle}</p>
            </div>
            {/* Calendar sync buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", flexShrink: 0 }}>
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent btn-sm"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                📅 {tx.add_google}
              </a>
              <a
                href={icsUrl}
                download="taxwijs-2026.ics"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                ⬇️ {tx.download_ics}
              </a>
            </div>
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-5)" }}>
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`pill ${filter === cat ? "pill-accent" : ""}`}
                style={{ cursor: "pointer", border: "1px solid var(--hairline-2)", background: filter === cat ? undefined : "var(--paper)" }}
              >
                {cat === "all" ? tx.filter_all : (meta ? `${meta.icon} ${meta.label}` : cat)}
              </button>
            );
          })}
        </div>

        {/* Reminder list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--sp-10)", color: "var(--ink-3)" }}>{tx.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)" }}>{tx.empty}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {filtered.map(r => {
              const { text: daysText, urgent } = daysLabel(r.days_until, tx);
              const meta = CATEGORY_META[r.category];
              return (
                <div key={r.id} className="card" style={{ padding: "var(--sp-4) var(--sp-5)", borderInlineStart: `3px solid ${meta?.color || "var(--sage-400)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)", flexWrap: "wrap" }}>
                        {meta && <span style={{ fontSize: 14 }}>{meta.icon}</span>}
                        <span className="eyebrow" style={{ color: meta?.color }}>{meta?.label || r.category}</span>
                        <span className="pill pill-sm" style={{
                          background: urgent ? "var(--danger-soft)" : "var(--accent-soft)",
                          color: urgent ? "var(--danger)" : "var(--sage-700)",
                          fontSize: 11,
                        }}>
                          {daysText}
                        </span>
                      </div>
                      <h3 style={{ fontWeight: 600, color: "var(--ink)", fontSize: "var(--text-sm)", margin: 0 }}>{r.title}</h3>
                      <p style={{ color: "var(--ink-3)", fontSize: "var(--text-xs)", marginTop: "var(--sp-1)", lineHeight: "var(--leading-relaxed)" }}>
                        {r.description}
                      </p>
                      <div style={{ marginTop: "var(--sp-2)", display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>
                          📅 {r.due_date}
                        </span>
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-xs)", color: "var(--sage-700)" }}>
                            {tx.source} →
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flexShrink: 0, fontSize: "var(--text-xs)" }}
                      onClick={() => navigate("/chat", { state: { question: r.title } })}
                    >
                      {tx.ask_ai}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
