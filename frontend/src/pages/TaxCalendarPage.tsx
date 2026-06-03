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

type Lang = "nl" | "en" | "fa";

// Category meta — labels are now per-language (CAL-3)
const CATEGORY_META: Record<string, { icon: string; color: string; label: Record<Lang, string> }> = {
  income_tax:             { icon: "📄", color: "var(--sage-600)",        label: { nl: "Inkomstenbelasting", en: "Income Tax",      fa: "مالیات بر درآمد" } },
  vat:                    { icon: "🧾", color: "oklch(0.55 0.14 230)",   label: { nl: "BTW / OB",           en: "BTW / VAT",       fa: "مالیات بر ارزش افزوده" } },
  toeslagen:              { icon: "🏠", color: "oklch(0.55 0.12 50)",    label: { nl: "Toeslagen",          en: "Toeslagen",       fa: "یارانه‌ها" } },
  provisional_assessment: { icon: "📊", color: "oklch(0.52 0.13 290)",   label: { nl: "Voorlopige aanslag", en: "Provisional",     fa: "ارزیابی اولیه" } },
  expat:                  { icon: "✈️", color: "oklch(0.62 0.13 50)",    label: { nl: "Expat",              en: "Expat",           fa: "اکسپت" } },
  dga:                    { icon: "🏢", color: "oklch(0.55 0.10 290)",   label: { nl: "DGA / BV",           en: "DGA / BV",        fa: "DGA / BV" } },
  box3:                   { icon: "💰", color: "oklch(0.55 0.08 160)",   label: { nl: "Box 3",              en: "Box 3",           fa: "جعبه ۳" } },
  zzp_admin:              { icon: "⏱️", color: "var(--sage-700)",        label: { nl: "ZZP Admin",          en: "ZZP Admin",       fa: "مدیریت ZZP" } },
  corporate_tax:          { icon: "🏭", color: "oklch(0.48 0.12 290)",   label: { nl: "Vpb",                en: "Corp. Tax",       fa: "مالیات شرکتی" } },
  payroll:                { icon: "💼", color: "oklch(0.50 0.14 170)",   label: { nl: "Loonheffing",        en: "Payroll",         fa: "مالیات حقوق" } },
  dividend_tax:           { icon: "💹", color: "oklch(0.55 0.15 50)",    label: { nl: "Dividend",           en: "Dividend",        fa: "سود سهام" } },
};

const TX: Record<Lang, {
  title: string;
  subtitle: string;
  badge: string;
  loading: string;
  empty: string;
  error: string;
  days_until: string;
  today: string;
  past: string;
  source: string;
  add_google: string;
  download_ics: string;
  filter_all: string;
  ask_ai: string;
  categories: string;
  add_event: string;
  no_reminders_to_sync: string;
}> = {
  nl: {
    title: "Belastingkalender 2026",
    subtitle: "Alle deadlines en herinneringen op één plek",
    badge: "Smart kalender",
    loading: "Reminders laden...",
    empty: "Geen aankomende reminders gevonden",
    error: "Reminders konden niet worden geladen — probeer de pagina te vernieuwen",
    days_until: "over {{n}} dag(en)",
    today: "Vandaag",
    past: "Verlopen",
    source: "Bron",
    add_google: "Abonneren op Google Calendar",
    download_ics: "Download .ics (Apple / Outlook)",
    filter_all: "Alle",
    ask_ai: "Vraag de AI →",
    categories: "Categorieën",
    add_event: "📅 Toevoegen",
    no_reminders_to_sync: "Geen reminders om te synchroniseren",
  },
  en: {
    title: "Tax Calendar 2026",
    subtitle: "All deadlines and reminders in one place",
    badge: "Smart calendar",
    loading: "Loading reminders...",
    empty: "No upcoming reminders found",
    error: "Could not load reminders — try refreshing the page",
    days_until: "in {{n}} day(s)",
    today: "Today",
    past: "Overdue",
    source: "Source",
    add_google: "Subscribe in Google Calendar",
    download_ics: "Download .ics (Apple / Outlook)",
    filter_all: "All",
    ask_ai: "Ask the AI →",
    categories: "Categories",
    add_event: "📅 Add event",
    no_reminders_to_sync: "No reminders to sync",
  },
  fa: {
    title: "تقویم مالیاتی ۲۰۲۶",
    subtitle: "تمام مهلت‌ها و یادآوری‌ها در یک مکان",
    badge: "تقویم هوشمند",
    loading: "در حال بارگذاری یادآوری‌ها...",
    empty: "یادآوری آینده‌ای یافت نشد",
    error: "یادآوری‌ها بارگذاری نشد — صفحه را تازه‌سازی کنید",
    days_until: "{{n}} روز دیگر",
    today: "امروز",
    past: "منقضی",
    source: "منبع",
    add_google: "اشتراک در Google Calendar",
    download_ics: "دانلود .ics (Apple / Outlook)",
    filter_all: "همه",
    ask_ai: "از هوش مصنوعی بپرس ←",
    categories: "دسته‌بندی‌ها",
    add_event: "📅 افزودن رویداد",
    no_reminders_to_sync: "یادآوری‌ای برای همگام‌سازی وجود ندارد",
  },
};

function daysLabel(days: number, tx: (typeof TX)[Lang]): { text: string; urgent: boolean } {
  if (days === 0) return { text: tx.today, urgent: true };
  if (days < 0)  return { text: tx.past,  urgent: true };
  return {
    text: tx.days_until.replace("{{n}}", String(days)),
    urgent: days <= 7,
  };
}

/** Build a Google Calendar single-event "add" URL for one reminder (CAL-5). */
function googleEventUrl(r: Reminder): string {
  const d = r.due_date.replace(/-/g, ""); // YYYYMMDD
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: r.title,
    dates: `${d}/${d}`,
    details: r.description + (r.source_url ? `\n\nSource: ${r.source_url}` : ""),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function TaxCalendarPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = (i18n.language === "nl" || i18n.language === "fa") ? i18n.language as Lang : "en";
  const tx = TX[lang];
  const isRtl = lang === "fa";

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [filter, setFilter]       = useState("all");

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${apiBase}/users/reminders/?lang=${lang}&days=366`, {
      headers: authHeader(),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Reminder[]>;
      })
      .then(data => {
        setReminders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lang]);

  const categories = ["all", ...Array.from(new Set(reminders.map(r => r.category)))];
  const filtered   = filter === "all" ? reminders : reminders.filter(r => r.category === filter);

  // iCal feed URL — relative for .ics download (browser resolves it)
  const icsUrl = `${apiBase}/users/calendar.ics`;
  // Google Calendar cid= needs a fully absolute URL using webcal:// protocol.
  // https:// is rejected with "unable to add calendar". webcal:// is the standard.
  const icsAbsoluteUrl = apiBase.startsWith("http")
    ? icsUrl
    : `${window.location.origin}${icsUrl}`;
  const webcalUrl = icsAbsoluteUrl.replace(/^https?:\/\//, "webcal://");
  const googleUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;

  const hasReminders = !loading && !error && reminders.length > 0;

  return (
    <main style={{ background: "var(--paper)", flex: 1 }} dir={isRtl ? "rtl" : "ltr"}>
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

            {/* Calendar sync buttons — disabled when there are no reminders (CAL-1) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", flexShrink: 0 }}>
              {hasReminders ? (
                <>
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent btn-sm"
                    style={{ textDecoration: "none", textAlign: "center" }}
                    title={tx.add_google}
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
                </>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", padding: "var(--sp-2) 0" }}>
                  {loading ? "" : tx.no_reminders_to_sync}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category filter pills */}
        {!loading && !error && reminders.length > 0 && (
          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-5)" }}>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat];
              const label = cat === "all" ? tx.filter_all : (meta ? `${meta.icon} ${meta.label[lang]}` : cat);
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`pill ${filter === cat ? "pill-accent" : ""}`}
                  style={{ cursor: "pointer", border: "1px solid var(--hairline-2)", background: filter === cat ? undefined : "var(--paper)" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Content area */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--sp-10)", color: "var(--ink-3)" }}>{tx.loading}</div>
        ) : error ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--danger)", border: "1px solid var(--danger-soft)" }}>
            ⚠️ {tx.error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-3)" }}>{tx.empty}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {filtered.map(r => {
              const { text: daysText, urgent } = daysLabel(r.days_until, tx);
              const meta = CATEGORY_META[r.category];
              const catLabel = meta ? meta.label[lang] : r.category;
              return (
                <div key={r.id} className="card" style={{ padding: "var(--sp-4) var(--sp-5)", borderInlineStart: `3px solid ${meta?.color || "var(--sage-400)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)", flexWrap: "wrap" }}>
                        {meta && <span style={{ fontSize: 14 }}>{meta.icon}</span>}
                        <span className="eyebrow" style={{ color: meta?.color }}>{catLabel}</span>
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
                        {/* Per-reminder Google Calendar event link (CAL-5) */}
                        <a
                          href={googleEventUrl(r)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", textDecoration: "none" }}
                        >
                          {tx.add_event}
                        </a>
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
