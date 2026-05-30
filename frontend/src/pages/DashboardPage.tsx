import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { Icon } from "../components/Icon";
import { Skeleton } from "../components/Skeleton";

interface CalcResult {
  result: {
    total_tax_due: number;
    effective_rate: number;
    monthly_reserve_needed: number;
    wet_dba_risk?: string;
  };
  calculation: Record<string, number>;
}

interface Alert {
  id: string;
  category: "deadline" | "risk" | "opportunity" | "missing_data" | "cashflow" | "compliance";
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  action_label: string;
  action_url: string;
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

const SEVERITY_STYLE: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: "var(--danger-soft)", border: "oklch(0.85 0.07 25)", dot: "var(--danger)", label: "URGENT" },
  warning:  { bg: "var(--warn-soft)",   border: "oklch(0.85 0.07 75)",  dot: "var(--warn)",   label: "ALERT"  },
  info:     { bg: "var(--accent-soft)", border: "var(--accent-line)",    dot: "var(--sage-600)", label: "INFO" },
};

const CATEGORY_ICON: Record<string, string> = {
  deadline: "📅", risk: "⚠️", opportunity: "💡", missing_data: "📋", cashflow: "💰", compliance: "🔍",
};

function SummaryCard({
  title, value, subtitle, accent, loading, valueColor,
}: {
  title: string; value: string; subtitle?: string; accent?: boolean;
  loading?: boolean; valueColor?: string;
}) {
  return (
    <div className="card" style={{
      padding: "22px 24px",
      background: accent ? "var(--accent-soft)" : "var(--paper-2)",
      border: `1px solid ${accent ? "var(--accent-line)" : "var(--hairline)"}`,
    }}>
      <div className="eyebrow" style={{ color: accent ? "var(--sage-700)" : "var(--ink-3)" }}>{title}</div>
      <div style={{ marginTop: 8, minHeight: 44, display: "flex", alignItems: "center" }}>
        {loading
          ? <Skeleton height={36} width="70%" radius="var(--r-sm)" />
          : <span style={{
              fontFamily: "var(--serif)", fontSize: value === "—" ? 26 : 36,
              color: valueColor ?? (value === "—" ? "var(--ink-4)" : "var(--ink)"),
              letterSpacing: "-0.02em",
            }}>{value}</span>
        }
      </div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>{subtitle}</div>}
    </div>
  );
}

function TaxHealthScore({ score, loading }: { score: number; loading: boolean }) {
  const color = score >= 80 ? "var(--ok)" : score >= 55 ? "var(--warn)" : "var(--danger)";
  const label = score >= 80 ? "Good" : score >= 55 ? "Fair" : "Needs attention";
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  return (
    <div className="card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
      <div className="eyebrow" style={{ color: "var(--ink-3)" }}>Tax Health Score</div>
      {loading ? (
        <Skeleton height={96} width={96} radius="50%" />
      ) : (
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={48} cy={48} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={7} />
            <circle cx={48} cy={48} r={radius} fill="none" stroke={color} strokeWidth={7}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 24, color, letterSpacing: "-0.02em" }}>{score}</span>
          </div>
        </div>
      )}
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
      <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: 0, maxWidth: 160, lineHeight: 1.5 }}>
        Based on profile completeness, compliance, and deadlines
      </p>
    </div>
  );
}

function computeHealthScore(
  profile: Record<string, unknown> | null,
  alerts: Alert[],
): number {
  if (!profile) return 0;
  let score = 60; // base
  // Completeness bonus
  if (profile.box3_assets !== undefined) score += 8;
  if (profile.has_partner !== undefined) score += 5;
  if (profile.children_under_12 !== undefined) score += 5;
  // Alert penalties
  for (const a of alerts) {
    if (a.severity === "critical") score -= 15;
    else if (a.severity === "warning") score -= 7;
  }
  // Opportunity bonus (opportunities don't penalise — they reward taking action)
  const opportunities = alerts.filter(a => a.category === "opportunity");
  if (opportunities.length === 0) score += 10; // no missed opportunities
  return Math.max(0, Math.min(100, Math.round(score)));
}

const DEADLINES = [
  { date: "30 Apr 2026", label: { nl: "BTW Q1 aangifte", en: "VAT Q1 return", fa: "اظهارنامه Q1" }, urgency: "warn" as const },
  { date: "1 May 2026",  label: { nl: "IB aangifte 2025", en: "IB return 2025", fa: "اظهارنامه درآمد ۲۰۲۵" }, urgency: "warn" as const },
  { date: "31 Jul 2026", label: { nl: "BTW Q2 aangifte", en: "VAT Q2 return", fa: "اظهارنامه Q2" }, urgency: "ok" as const },
  { date: "31 Oct 2026", label: { nl: "BTW Q3 aangifte", en: "VAT Q3 return", fa: "اظهارنامه Q3" }, urgency: "ok" as const },
];

export default function DashboardPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("taxwijs_dismissed_alerts") ?? "[]") as string[]); }
    catch { return new Set(); }
  });

  const [profile, setProfile] = useState<Record<string, unknown> | null>(() => {
    try {
      const r = localStorage.getItem("taxwijs_calc_input");
      return r ? (JSON.parse(r) as Record<string, unknown>) : null;
    } catch { return null; }
  });

  const authHeader = (): Record<string, string> => {
    const t = localStorage.getItem("access_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!profile) {
      fetch("/api/users/profile/", { headers: authHeader() })
        .then(r => r.ok ? r.json() as Promise<{ intake_profile?: Record<string, unknown> | null }> : null)
        .then(data => { if (data?.intake_profile) { localStorage.setItem("taxwijs_calc_input", JSON.stringify(data.intake_profile)); setProfile(data.intake_profile); } })
        .catch(() => null);
    }
    fetch("/api/calculator/history/", { headers: authHeader() })
      .then(r => r.ok ? r.json() as Promise<HistoryItem[]> : [])
      .then(data => setHistory(data))
      .catch(() => null);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    setLoadingCalc(true);
    fetch("/api/calculator/calculate/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(profile),
    })
      .then(r => r.json() as Promise<CalcResult>)
      .then(data => setCalcResult(data))
      .catch(() => null)
      .finally(() => setLoadingCalc(false));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load alerts once we have a profile
  useEffect(() => {
    if (!profile) return;
    setLoadingAlerts(true);
    fetch("/api/users/alerts/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ profile, lang }),
    })
      .then(r => r.ok ? r.json() as Promise<Alert[]> : [])
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoadingAlerts(false));
  }, [profile, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  function dismissAlert(id: string) {
    const next = new Set([...dismissedAlerts, id]);
    setDismissedAlerts(next);
    localStorage.setItem("taxwijs_dismissed_alerts", JSON.stringify([...next]));
  }

  const userType = String(profile?.user_type ?? "");
  const totalTax = calcResult?.result.total_tax_due ?? 0;
  const effectiveRate = calcResult?.result.effective_rate ?? 0;
  const monthlyReserve = calcResult?.result.monthly_reserve_needed ?? 0;
  const wetDba = calcResult?.result.wet_dba_risk ?? "";
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));
  const healthScore = computeHealthScore(profile, visibleAlerts);
  const criticalCount = visibleAlerts.filter(a => a.severity === "critical").length;
  const deadlineLabel = (d: typeof DEADLINES[0]) => d.label[lang] ?? d.label.en;

  const txt = {
    dashboard: { nl: "Dashboard", en: "Dashboard", fa: "داشبورد" },
    welcome: { nl: "Welkom terug", en: "Welcome back", fa: "خوش آمدید" },
    noProfile: { nl: "Profiel niet ingesteld", en: "Profile not set up", fa: "پروفایل تنظیم نشده" },
    noProfileBody: { nl: "Stel uw profiel in voor een gepersonaliseerd belastingoverzicht.", en: "Set up your profile to get your personalised tax overview.", fa: "پروفایل خود را تنظیم کنید تا خلاصه مالیاتی شخصی خود را ببینید." },
    setupProfile: { nl: "Profiel instellen", en: "Set up profile", fa: "تنظیم پروفایل" },
    totalTax: { nl: "Totale belasting", en: "Total tax", fa: "مجموع مالیات" },
    effectiveRate: { nl: "Effectief tarief", en: "Effective rate", fa: "نرخ مؤثر" },
    monthlyReserve: { nl: "Maandelijks reserveren", en: "Monthly reserve", fa: "ذخیره ماهانه" },
    setAside: { nl: "Apart zetten", en: "Set aside", fa: "کنار بگذارید" },
    wetDbaRisk: { nl: "Wet DBA risico", en: "Wet DBA risk", fa: "ریسک Wet DBA" },
    notCalc: { nl: "Nog niet berekend", en: "Not yet calculated", fa: "هنوز محاسبه نشده" },
    alerts: { nl: "Meldingen", en: "Alerts", fa: "هشدارها" },
    noAlerts: { nl: "Geen actieve meldingen", en: "No active alerts", fa: "هیچ هشداری ندارید" },
    noAlertsBody: { nl: "Uw belastingsituatie ziet er goed uit.", en: "Your tax situation looks good", fa: "وضعیت مالیاتی شما خوب است" },
    actions: { nl: "Snelle acties", en: "Quick actions", fa: "اقدامات سریع" },
    deadlines: { nl: "Aankomende deadlines", en: "Upcoming deadlines", fa: "مهلت‌های پیش رو" },
    history: { nl: "Berekeningen", en: "History", fa: "تاریخچه" },
    profile: { nl: "Uw profiel", en: "Your profile", fa: "پروفایل شما" },
    account: { nl: "Account", en: "Account", fa: "حساب کاربری" },
    upgrade: { nl: "Upgrade →", en: "Upgrade →", fa: "ارتقاء →" },
    type: { nl: "Type", en: "Type", fa: "نوع" },
    income: { nl: "Inkomen", en: "Income", fa: "درآمد" },
    partner: { nl: "Fiscaal partner", en: "Fiscal partner", fa: "شریک مالیاتی" },
    yes: { nl: "Ja", en: "Yes", fa: "بله" },
    no: { nl: "Nee", en: "No", fa: "خیر" },
    children: { nl: "Kinderen <12", en: "Children <12", fa: "فرزندان <۱۲" },
    askAssistant: { nl: "Vraag de assistent", en: "Ask the assistant", fa: "از دستیار بپرسید" },
    updateProfile: { nl: "Profiel bijwerken", en: "Update profile", fa: "به‌روزرسانی پروفایل" },
    ibGuide: { nl: "IB-aangifte gids", en: "IB return guide", fa: "راهنمای اظهارنامه" },
    simulation: { nl: "Belasting simulatie", en: "Tax simulation", fa: "شبیه‌سازی مالیات" },
    criticalAlert: { nl: `${criticalCount} kritische melding${criticalCount !== 1 ? "en" : ""}`, en: `${criticalCount} critical alert${criticalCount !== 1 ? "s" : ""}`, fa: `${criticalCount} هشدار بحرانی` },
  };

  const t = (key: keyof typeof txt) => txt[key][lang] ?? txt[key].en;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ flex: 1, padding: isMobile ? "24px 16px" : "40px 28px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow eyebrow-accent">{t("dashboard")}</div>
        <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: isMobile ? 26 : 36, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {t("welcome")}
          {user?.email ? <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: "0.62em" }}>, {user.email.split("@")[0]}</span> : null}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {user?.plan === "premium" && <span className="pill pill-accent">⚡ Premium</span>}
          {criticalCount > 0 && (
            <span className="pill pill-danger" style={{ cursor: "pointer" }} onClick={() => document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth" })}>
              ⚠ {t("criticalAlert")}
            </span>
          )}
        </div>
      </div>

      {/* No profile banner */}
      {!profile && (
        <div className="card" style={{ padding: "22px 24px", marginBottom: 28, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{t("noProfile")}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{t("noProfileBody")}</div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => navigate("/intake")}>
            {t("setupProfile")} <Icon.arrow />
          </button>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      {profile && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <SummaryCard
            title={t("totalTax")} value={`€${Math.round(totalTax).toLocaleString("nl-NL")}`}
            subtitle="2026" accent loading={loadingCalc}
          />
          <SummaryCard
            title={t("effectiveRate")} value={loadingCalc ? "—" : `${(effectiveRate * 100).toFixed(1)}%`}
            subtitle={loadingCalc ? undefined : `~€${Math.round(effectiveRate * 100)} per €100`}
            loading={loadingCalc}
          />
          <SummaryCard
            title={t("monthlyReserve")} value={`€${Math.round(monthlyReserve).toLocaleString("nl-NL")}`}
            subtitle={t("setAside")} loading={loadingCalc}
          />
          {userType === "zzp" ? (
            <SummaryCard
              title={t("wetDbaRisk")}
              value={wetDba ? wetDba.charAt(0).toUpperCase() + wetDba.slice(1).toLowerCase() : "—"}
              subtitle={wetDba ? t("wetDbaRisk") : t("notCalc")}
              valueColor={wetDba === "high" ? "var(--danger)" : wetDba === "medium" ? "var(--warn)" : wetDba === "low" ? "var(--ok)" : undefined}
              loading={loadingCalc}
            />
          ) : (
            <TaxHealthScore score={healthScore} loading={loadingCalc || loadingAlerts} />
          )}
        </div>
      )}

      {/* ── Two-column main layout ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "flex-start" }}>

        {/* LEFT: Alerts + Actions + History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Proactive Alert Feed ──────────────────────────────────────── */}
          <div id="alerts-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="eyebrow eyebrow-accent">{t("alerts")}</span>
              {visibleAlerts.length > 0 && (
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {visibleAlerts.length} active
                </span>
              )}
            </div>

            {loadingAlerts ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton height={72} radius="var(--r-lg)" />
                <Skeleton height={72} radius="var(--r-lg)" />
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{t("noAlerts")}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{t("noAlertsBody")}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleAlerts.map(alert => {
                  const s = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info;
                  return (
                    <div
                      key={alert.id}
                      className="card"
                      style={{
                        padding: "16px 18px",
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                        {CATEGORY_ICON[alert.category] ?? "ℹ️"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{alert.title}</span>
                          <span className="pill" style={{ fontSize: 9, padding: "2px 7px", background: s.dot, color: "white", borderRadius: 999 }}>{s.label}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>{alert.body}</p>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <a
                            href={alert.action_url}
                            target={alert.action_url.startsWith("http") ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, color: "var(--sage-700)", fontWeight: 500, textDecoration: "none" }}
                          >
                            {alert.action_label} →
                          </a>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Quick actions ─────────────────────────────────────────────── */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="eyebrow" style={{ marginBottom: 14, color: "var(--ink-3)" }}>{t("actions")}</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {[
                { icon: "spark", label: t("askAssistant"), to: "/chat", primary: true },
                { icon: "edit",  label: t("updateProfile"), to: "/intake" },
                { icon: "info",  label: t("ibGuide"), to: "/ib-guide" },
                { icon: "chev",  label: t("simulation"), to: "/simulation" },
              ].map(action => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className={action.primary ? "btn btn-accent" : "btn btn-soft btn-sm"}
                  style={{ justifyContent: "flex-start", gap: 8, textAlign: "left" }}
                >
                  {action.icon === "spark" && <Icon.spark />}
                  {action.icon === "edit" && <Icon.edit />}
                  {action.icon === "info" && <Icon.info />}
                  {action.icon === "chev" && <Icon.chev />}
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Calculation history ───────────────────────────────────────── */}
          {history.length > 0 && (
            <div className="card" style={{ padding: "22px 24px" }}>
              <div className="eyebrow" style={{ marginBottom: 14, color: "var(--ink-3)" }}>{t("history")}</div>
              {history.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}>
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
          )}
        </div>

        {/* RIGHT: Health score (ZZP) + Profile + Deadlines + Account */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tax Health Score — show in sidebar for ZZP since it's in the card grid for others */}
          {userType === "zzp" && profile && (
            <TaxHealthScore score={healthScore} loading={loadingCalc || loadingAlerts} />
          )}

          {/* Profile card */}
          {profile && (
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="eyebrow" style={{ color: "var(--ink-3)" }}>{t("profile")}</div>
                <button onClick={() => navigate("/intake")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}>
                  <Icon.edit />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: t("type"), value: String(profile.user_type ?? "").toUpperCase() },
                  { label: t("income"), value: `€${(((profile.annual_revenue_zzp as number) || (profile.employment_income as number) || 0)).toLocaleString("nl-NL")}` },
                  profile.has_partner !== undefined
                    ? { label: t("partner"), value: profile.has_partner ? t("yes") : t("no") }
                    : null,
                  profile.children_under_12
                    ? { label: t("children"), value: String(profile.children_under_12) }
                    : null,
                ].filter(Boolean).map(row => row && (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)" }}>{row.label}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deadlines */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>{t("deadlines")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DEADLINES.map(d => (
                <div key={d.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{deadlineLabel(d)}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{d.date}</div>
                  </div>
                  <span className={`pill pill-${d.urgency}`} aria-label={d.urgency === "warn" ? "Upcoming soon" : "Upcoming"} style={{ fontSize: 10.5, flexShrink: 0 }}>
                    {d.urgency === "warn" ? "!" : "✓"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="card" style={{ padding: "18px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 10 }}>{t("account")}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{user?.email}</div>
            <div style={{ marginTop: 6 }}>
              {user?.plan === "premium" ? (
                <span className="pill pill-accent">⚡ Premium</span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>Free</span>
                  <button onClick={() => navigate("/pricing")} style={{ background: "none", border: "none", fontSize: 12, color: "var(--sage-700)", fontWeight: 500, cursor: "pointer", padding: 0 }}>
                    {t("upgrade")}
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
