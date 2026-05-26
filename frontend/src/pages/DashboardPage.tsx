import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { Icon } from "../components/Icon";

interface CalcResult {
  result: {
    total_tax: number;
    effective_rate: number;
    monthly_reserve_needed: number;
    wet_dba_risk?: string;
  };
  calculation: {
    gross_profit?: number;
    employment_income?: number;
    total_tax_due: number;
  };
}

interface HistoryItem {
  id: number;
  tax_year: number;
  total_tax_due: number;
  effective_rate: number;
  monthly_reserve: number;
  created_at: string;
  input_snapshot: Record<string, unknown>;
}

const DEADLINES = [
  { date: "30 April 2026", label: { nl: "BTW Q1 aangifte", en: "VAT Q1 return", fa: "اظهارنامه مالیات بر ارزش افزوده Q1" }, urgency: "warn" as const },
  { date: "1 May 2026",   label: { nl: "IB aangifte 2025", en: "IB return 2025", fa: "اظهارنامه مالیات بر درآمد ۲۰۲۵" }, urgency: "warn" as const },
  { date: "31 July 2026", label: { nl: "BTW Q2 aangifte", en: "VAT Q2 return", fa: "اظهارنامه مالیات بر ارزش افزوده Q2" }, urgency: "ok" as const },
  { date: "31 Oct 2026",  label: { nl: "BTW Q3 aangifte", en: "VAT Q3 return", fa: "اظهارنامه مالیات بر ارزش افزوده Q3" }, urgency: "ok" as const },
];

function SummaryCard({ title, value, subtitle, accent }: { title: string; value: string; subtitle?: string; accent?: boolean }) {
  return (
    <div className="card" style={{
      padding: "22px 24px",
      background: accent ? "var(--accent-soft)" : "var(--paper-2)",
      border: `1px solid ${accent ? "var(--accent-line)" : "var(--hairline)"}`,
    }}>
      <div className="eyebrow" style={{ color: accent ? "var(--sage-700)" : "var(--ink-3)" }}>{title}</div>
      <div style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 36, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingCalc, setLoadingCalc] = useState(false);

  const profile = (() => {
    try {
      const r = localStorage.getItem("taxwijs_calc_input");
      return r ? (JSON.parse(r) as Record<string, unknown>) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Run calculator silently with stored profile
    if (profile) {
      setLoadingCalc(true);
      fetch("/api/calculator/calculate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("access_token") ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {}),
        },
        body: JSON.stringify(profile),
      })
        .then(r => r.json() as Promise<CalcResult>)
        .then(data => setCalcResult(data))
        .catch(() => null)
        .finally(() => setLoadingCalc(false));
    }
    // Load calculation history
    fetch("/api/calculator/history/", {
      headers: {
        ...(localStorage.getItem("access_token") ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {}),
      },
    })
      .then(r => r.ok ? r.json() as Promise<HistoryItem[]> : [])
      .then(data => setHistory(data))
      .catch(() => null);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const userType = String(profile?.user_type ?? "");
  const totalTax = calcResult?.result.total_tax ?? 0;
  const effectiveRate = calcResult?.result.effective_rate ?? 0;
  const monthlyReserve = calcResult?.result.monthly_reserve_needed ?? 0;
  const wetDba = calcResult?.result.wet_dba_risk ?? "";

  const deadlineLabel = (d: typeof DEADLINES[0]) => d.label[lang] ?? d.label.en;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ flex: 1, padding: isMobile ? "24px 16px" : "40px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow eyebrow-accent">{t("nav.dashboard", { defaultValue: "Dashboard" })}</div>
        <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {lang === "nl" ? "Welkom terug" : lang === "fa" ? "خوش آمدید" : "Welcome back"}
          {user?.email ? <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: "0.65em" }}>, {user.email.split("@")[0]}</span> : null}
        </h1>
        {user?.plan === "premium" && (
          <span className="pill pill-accent" style={{ marginTop: 8, display: "inline-block" }}>⚡ Premium</span>
        )}
      </div>

      {/* No profile banner */}
      {!profile && (
        <div className="card" style={{ padding: "22px 24px", marginBottom: 28, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>
              {lang === "nl" ? "Profiel nog niet ingesteld" : lang === "fa" ? "پروفایل تنظیم نشده" : "Profile not set up yet"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
              {lang === "nl" ? "Stel uw profiel in om uw belastingschatting te zien." : lang === "fa" ? "پروفایل خود را تنظیم کنید تا تخمین مالیات را ببینید." : "Set up your profile to see your tax estimate."}
            </div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => navigate("/intake")}>
            {lang === "nl" ? "Profiel instellen" : lang === "fa" ? "تنظیم پروفایل" : "Set up profile"} <Icon.arrow />
          </button>
        </div>
      )}

      {/* Tax summary cards */}
      {profile && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
          <SummaryCard
            title={lang === "nl" ? "Totale belasting" : lang === "fa" ? "مجموع مالیات" : "Total tax"}
            value={loadingCalc ? "…" : `€${Math.round(totalTax).toLocaleString("nl-NL")}`}
            subtitle="2026"
            accent
          />
          <SummaryCard
            title={lang === "nl" ? "Effectief tarief" : lang === "fa" ? "نرخ مؤثر" : "Effective rate"}
            value={loadingCalc ? "…" : `${(effectiveRate * 100).toFixed(1)}%`}
          />
          <SummaryCard
            title={lang === "nl" ? "Maandelijks reserveren" : lang === "fa" ? "ذخیره ماهانه" : "Monthly reserve"}
            value={loadingCalc ? "…" : `€${Math.round(monthlyReserve).toLocaleString("nl-NL")}`}
            subtitle={lang === "nl" ? "Apart zetten" : lang === "fa" ? "کنار بگذارید" : "Set aside"}
          />
          {userType === "zzp" && (
            <SummaryCard
              title="Wet DBA"
              value={loadingCalc ? "…" : (wetDba || "N/A")}
              subtitle={lang === "nl" ? "Risico" : lang === "fa" ? "ریسک" : "Risk level"}
            />
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "flex-start" }}>

        {/* Left: Quick actions + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick actions */}
          <div className="card" style={{ padding: "24px" }}>
            <div className="eyebrow" style={{ marginBottom: 16, color: "var(--ink-3)" }}>
              {lang === "nl" ? "Snelle acties" : lang === "fa" ? "اقدامات سریع" : "Quick actions"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {[
                { icon: "spark", label: { nl: "Vraag de assistent", en: "Ask the assistant", fa: "از دستیار بپرسید" }, to: "/chat", primary: true },
                { icon: "edit",  label: { nl: "Profiel bijwerken", en: "Update profile", fa: "به‌روزرسانی پروفایل" }, to: "/intake" },
                { icon: "info",  label: { nl: "IB-aangifte gids", en: "IB return guide", fa: "راهنمای اظهارنامه" }, to: "/ib-guide" },
                { icon: "chev",  label: { nl: "Belasting simulatie", en: "Tax simulation", fa: "شبیه‌سازی مالیات" }, to: "/simulation" },
              ].map(action => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className={action.primary ? "btn btn-accent" : "btn btn-soft btn-sm"}
                  style={{ justifyContent: "flex-start", gap: 8, textAlign: "left" }}
                >
                  <span style={{ opacity: 0.8 }}>
                    {action.icon === "spark" && <Icon.spark />}
                    {action.icon === "edit" && <Icon.edit />}
                    {action.icon === "info" && <Icon.info />}
                    {action.icon === "chev" && <Icon.chev />}
                  </span>
                  {action.label[lang] ?? action.label.en}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation history */}
          {history.length > 0 && (
            <div className="card" style={{ padding: "24px" }}>
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--ink-3)" }}>
                {lang === "nl" ? "Berekeningen" : lang === "fa" ? "محاسبات" : "Calculation history"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {history.slice(0, 5).map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
                        {String(item.input_snapshot?.user_type ?? "").toUpperCase()} · {item.tax_year}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {new Date(item.created_at).toLocaleDateString(lang === "nl" ? "nl-NL" : lang === "fa" ? "fa-IR" : "en-GB")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="font-mono" style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>
                        €{Math.round(item.total_tax_due).toLocaleString("nl-NL")}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                        {(item.effective_rate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: profile summary + deadlines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile card */}
          {profile && (
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="eyebrow" style={{ color: "var(--ink-3)" }}>
                  {lang === "nl" ? "Uw profiel" : lang === "fa" ? "پروفایل شما" : "Your profile"}
                </div>
                <button onClick={() => navigate("/intake")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}>
                  <Icon.edit />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    label: lang === "nl" ? "Type" : lang === "fa" ? "نوع" : "Type",
                    value: String(profile.user_type ?? "").toUpperCase(),
                  },
                  {
                    label: lang === "nl" ? "Inkomen" : lang === "fa" ? "درآمد" : "Income",
                    value: `€${(((profile.annual_revenue_zzp as number) || (profile.employment_income as number) || 0)).toLocaleString("nl-NL")}`,
                  },
                  profile.has_partner !== undefined ? {
                    label: lang === "nl" ? "Fiscaal partner" : lang === "fa" ? "شریک مالیاتی" : "Fiscal partner",
                    value: profile.has_partner ? (lang === "nl" ? "Ja" : lang === "fa" ? "بله" : "Yes") : (lang === "nl" ? "Nee" : lang === "fa" ? "خیر" : "No"),
                  } : null,
                  profile.children_under_12 ? {
                    label: lang === "nl" ? "Kinderen <12" : lang === "fa" ? "فرزندان <۱۲" : "Children <12",
                    value: String(profile.children_under_12),
                  } : null,
                ].filter(Boolean).map(row => row && (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)" }}>{row.label}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax deadlines */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
              {lang === "nl" ? "Aankomende deadlines" : lang === "fa" ? "مهلت‌های پیش رو" : "Upcoming deadlines"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DEADLINES.map(d => (
                <div key={d.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{deadlineLabel(d)}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{d.date}</div>
                  </div>
                  <span className={`pill pill-${d.urgency}`} style={{ fontSize: 10.5, flexShrink: 0 }}>
                    {d.urgency === "warn" ? "!" : "✓"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="card" style={{ padding: "18px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
              {lang === "nl" ? "Account" : lang === "fa" ? "حساب کاربری" : "Account"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{user?.email}</div>
            <div style={{ marginTop: 6 }}>
              {user?.plan === "premium" ? (
                <span className="pill pill-accent">⚡ Premium</span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>Free</span>
                  <button
                    onClick={() => navigate("/pricing")}
                    style={{ background: "none", border: "none", fontSize: 12, color: "var(--sage-700)", fontWeight: 500, cursor: "pointer", padding: 0 }}
                  >
                    Upgrade →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
