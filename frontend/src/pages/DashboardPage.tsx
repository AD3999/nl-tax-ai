import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { Icon } from "../components/Icon";
import { Skeleton } from "../components/Skeleton";
import {
  fetchActions,
  loadActionStates,
  saveActionState,
  snoozeItem,
  isSnoozed,
  fetchServerStates,
  persistStateToServer,
  type TaxAction,
  type ActionState,
} from "../api/actions";
import { apiBase, authHeader } from "../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  category: "deadline" | "risk" | "opportunity" | "missing_data" | "cashflow" | "compliance" | "rule_change";
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

interface RuleChange {
  rule_id: string;
  topic: string;
  category: string;
  plain_en: string;
  plain_nl: string;
  plain_fa: string;
  source_url: string;
  updated_at: string;
  updated_by: string;
  user_types: string[];
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SEV: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: "var(--danger-soft)", border: "oklch(0.85 0.07 25)", dot: "var(--danger)",   label: "URGENT" },
  warning:  { bg: "var(--warn-soft)",   border: "oklch(0.85 0.07 75)", dot: "var(--warn)",     label: "ALERT"  },
  info:     { bg: "var(--accent-soft)", border: "var(--accent-line)",  dot: "var(--sage-600)", label: "INFO"   },
};

const CAT_ICON: Record<string, string> = {
  deadline: "📅", risk: "⚠️", opportunity: "💡", missing_data: "📋",
  cashflow: "💰", compliance: "🔍", rule_change: "📋",
};

const ACTION_CAT_ICON: Record<string, string> = {
  filing: "📄", preparation: "📦", review: "🔎", optimization: "💡", compliance: "✅",
};

const ACTION_PRIORITY_COLOR: Record<string, string> = {
  high:   "var(--danger)",
  medium: "var(--warn)",
  low:    "var(--sage-600)",
};

const STATIC_DEADLINES = [
  { date: "30 Apr 2026", label: { nl: "BTW Q1 aangifte", en: "VAT Q1 return", fa: "اظهارنامه Q1" }, urgency: "warn" as const },
  { date: "1 May 2026",  label: { nl: "IB aangifte 2025", en: "IB return 2025", fa: "اظهارنامه درآمد ۲۰۲۵" }, urgency: "warn" as const },
  { date: "31 Jul 2026", label: { nl: "BTW Q2 aangifte", en: "VAT Q2 return", fa: "اظهارنامه Q2" }, urgency: "ok" as const },
  { date: "31 Oct 2026", label: { nl: "BTW Q3 aangifte", en: "VAT Q3 return", fa: "اظهارنامه Q3" }, urgency: "ok" as const },
];

// ── Helper: snooze alerts (stored separately) ────────────────────────────────
const ALERT_SNOOZE_KEY = "taxwijs_alert_snoozed_until";

function snoozeAlert(id: string, days: number): void {
  try {
    const map = JSON.parse(localStorage.getItem(ALERT_SNOOZE_KEY) ?? "{}") as Record<string, string>;
    const until = new Date();
    until.setDate(until.getDate() + days);
    map[id] = until.toISOString().slice(0, 10);
    localStorage.setItem(ALERT_SNOOZE_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

// Alert "done" state — spec requires done / dismissed / snoozed
const ALERT_DONE_KEY = "taxwijs_done_alerts";
function loadDoneAlerts(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(ALERT_DONE_KEY) ?? "[]") as string[]); }
  catch { return new Set(); }
}
function persistDoneAlerts(set: Set<string>): void {
  localStorage.setItem(ALERT_DONE_KEY, JSON.stringify([...set]));
}

// ── Compliance checklist (computed from profile + date) ──────────────────────
interface ComplianceItem { label: string; ok: boolean; note?: string }

function buildComplianceItems(
  profile: Record<string, unknown> | null,
  lang: string,
): ComplianceItem[] {
  if (!profile) return [];
  const today = new Date();
  const userType = String(profile.user_type ?? "");
  const t = (nl: string, en: string, fa: string) =>
    lang === "nl" ? nl : lang === "fa" ? fa : en;

  const items: ComplianceItem[] = [];

  // Hours tracked (ZZP)
  if (userType === "zzp") {
    const hours = Number(profile.hours_per_year ?? 0);
    items.push({
      label: t("Uren geregistreerd (urencriterium)", "Hours tracked (urencriterium)", "ساعات ثبت‌شده"),
      ok: hours >= 1225,
      note: hours > 0 && hours < 1225
        ? t(`${hours}/1.225 uur`, `${hours}/1,225 hrs`, `${hours}/۱,۲۲۵ ساعت`)
        : hours === 0
        ? t("Geen uren opgegeven", "No hours entered", "ساعتی ثبت نشده")
        : undefined,
    });
  }

  // Box 3 declared
  const box3 = Number(profile.box3_assets ?? profile.net_assets_box3 ?? -1);
  items.push({
    label: t("Box 3 opgegeven", "Box 3 declared", "باکس ۳ اظهار شده"),
    ok: box3 >= 0,
    note: box3 < 0 ? t("Niet ingevuld", "Not entered", "وارد نشده") : undefined,
  });

  // IB return (deadline May 1)
  const ibDeadline = new Date(today.getFullYear(), 4, 1); // May 1
  const ibFiled = today > ibDeadline;
  items.push({
    label: t("IB-aangifte 2025", "IB return 2025", "اظهارنامه مالیاتی ۲۰۲۵"),
    ok: ibFiled,
    note: !ibFiled
      ? t("Vervalt 1 mei 2026", "Due 1 May 2026", "مهلت ۱ مه ۲۰۲۶")
      : undefined,
  });

  // BTW Q1 (ZZP/DGA, deadline Apr 30)
  if (["zzp", "dga"].includes(userType)) {
    const q1Deadline = new Date(today.getFullYear(), 3, 30); // Apr 30
    const q1Filed = today > q1Deadline;
    items.push({
      label: t("BTW Q1 aangifte", "VAT Q1 return", "اظهارنامه VAT Q1"),
      ok: q1Filed,
      note: !q1Filed
        ? t("Vervalt 30 april 2026", "Due 30 April 2026", "مهلت ۳۰ آوریل ۲۰۲۶")
        : undefined,
    });
  }

  return items;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

interface ScoreFactor { label: string; delta: number; positive: boolean }

function computeHealthScore(
  profile: Record<string, unknown> | null,
  alerts: Alert[],
  calcResult?: { result: { total_tax_due: number; monthly_reserve_needed: number } } | null,
): { score: number; factors: ScoreFactor[] } {
  if (!profile) return { score: 0, factors: [] };
  // Baseline: 60 for all user types (a complete profile with no issues = ~85+)
  // ZZP starts at 55 because they have more mandatory checks (hours, ZVW, Wet DBA)
  let score = String(profile.user_type) === "zzp" ? 55 : 62;
  const factors: ScoreFactor[] = [];

  // ── Profile completeness (max +20) ────────────────────────────────────────
  if (profile.box3_assets !== undefined || profile.net_assets_box3 !== undefined) {
    score += 5; factors.push({ label: "Box 3 assets declared", delta: 5, positive: true });
  }
  if (profile.has_partner !== undefined) {
    score += 3; factors.push({ label: "Partner status set", delta: 3, positive: true });
  }
  if (Number(profile.children_under_12) > 0) {
    score += 2; factors.push({ label: "Children declared (IACK eligible)", delta: 2, positive: true });
  }
  if (profile.pension_contribution && Number(profile.pension_contribution) > 0) {
    score += 4; factors.push({ label: "Pension contribution declared", delta: 4, positive: true });
  }
  if (profile.kia_investments && Number(profile.kia_investments) > 0) {
    score += 3; factors.push({ label: "KIA investments declared", delta: 3, positive: true });
  }
  if (profile.business_expenses && Number(profile.business_expenses) > 0) {
    score += 3; factors.push({ label: "Business deductions declared", delta: 3, positive: true });
  }

  // ── Hours (urencriterium) — ZZP only (+8 or -10) ─────────────────────────
  if (profile.user_type === "zzp") {
    const hours = Number(profile.hours_per_year ?? 0);
    if (hours >= 1225) {
      score += 8; factors.push({ label: `Hours tracked: ${hours} hrs (urencriterium met)`, delta: 8, positive: true });
    } else if (hours > 0) {
      score -= 10; factors.push({ label: `Hours at risk: ${hours}/1,225 (urencriterium)`, delta: -10, positive: false });
    } else {
      score -= 5; factors.push({ label: "No hours entered — urencriterium unknown", delta: -5, positive: false });
    }
  }

  // ── Tax reserve adequacy (+10 or -8) ─────────────────────────────────────
  if (calcResult && ["zzp", "dga"].includes(String(profile.user_type ?? ""))) {
    const totalTax = calcResult.result.total_tax_due ?? 0;
    const monthlyReserve = calcResult.result.monthly_reserve_needed ?? 0;
    const currentMonth = new Date().getMonth(); // 0-indexed
    const expectedSaved = monthlyReserve * currentMonth;
    if (totalTax > 0 && monthlyReserve > 0) {
      const bufferRatio = currentMonth > 0 ? expectedSaved / totalTax : 1;
      if (bufferRatio >= 0.8) {
        score += 10; factors.push({ label: "Tax reserve on track", delta: 10, positive: true });
      } else if (bufferRatio >= 0.4) {
        score -= 5; factors.push({ label: "Tax reserve below target", delta: -5, positive: false });
      } else if (currentMonth > 2) {
        score -= 8; factors.push({ label: "Tax reserve significantly underfunded", delta: -8, positive: false });
      }
    }
  }

  // ── Active risks and compliance issues (penalty per alert) ───────────────
  for (const a of alerts) {
    if (a.severity === "critical") {
      score -= 15; factors.push({ label: a.title, delta: -15, positive: false });
    } else if (a.severity === "warning" && ["risk", "compliance"].includes(a.category)) {
      score -= 7; factors.push({ label: a.title, delta: -7, positive: false });
    }
  }

  // ── Missed opportunities (+5 if none, -3 per open opportunity) ───────────
  const opps = alerts.filter(a => a.category === "opportunity");
  if (opps.length === 0) {
    score += 5; factors.push({ label: "No missed tax opportunities", delta: 5, positive: true });
  } else if (opps.length >= 3) {
    score -= 3; factors.push({ label: `${opps.length} untapped tax opportunities`, delta: -3, positive: false });
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors };
}

// ── PDF Download Card ─────────────────────────────────────────────────────────
function PDFDownloadCard({ lang }: { lang: "nl" | "en" | "fa" }) {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const L = (nl: string, en: string, fa: string) =>
    lang === "nl" ? nl : lang === "fa" ? fa : en;

  async function downloadReport() {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${apiBase}/users/report/?lang=${i18n.language}`, {
        headers: authHeader(),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate report");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "taxwijs-report-2026.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error generating PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "18px 20px", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
            {L("Belastingrapport PDF", "Tax Health Report PDF", "گزارش سلامت مالیاتی PDF")}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
            {L("Uw complete 2026 belastingoverzicht", "Your complete 2026 tax overview", "نمای کلی مالیاتی کامل ۲۰۲۶ شما")}
          </div>
        </div>
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.5 }}>
        {L(
          "Bevat: belastingberekening, aftrekposten, risico's, deadlines, optimalisatietips en bronvermelding.",
          "Includes: tax calculation, deductions, risks, deadlines, optimization tips and source citations.",
          "شامل: محاسبه مالیات، کسورات، ریسک‌ها، مهلت‌ها، نکات بهینه‌سازی و منابع.",
        )}
      </div>
      {error && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginBottom: 8 }}>{error}</div>
      )}
      <button
        className="btn btn-accent btn-sm"
        style={{ width: "100%" }}
        onClick={downloadReport}
        disabled={loading}
      >
        {loading
          ? L("Rapport genereren...", "Generating report...", "در حال ایجاد گزارش...")
          : L("Download PDF rapport", "Download PDF report", "دانلود گزارش PDF")}
      </button>
    </div>
  );
}

function TaxHealthScoreCard({
  score, loading, factors, lang,
}: { score: number; loading: boolean; factors: ScoreFactor[]; lang: string }) {
  const [showFactors, setShowFactors] = useState(false);
  const color = score >= 80 ? "var(--ok)" : score >= 55 ? "var(--warn)" : "var(--danger)";
  const LABELS = {
    good:   { nl: "Goed",          en: "Good",           fa: "خوب" },
    fair:   { nl: "Redelijk",      en: "Fair",           fa: "متوسط" },
    poor:   { nl: "Aandacht nodig",en: "Needs attention",fa: "نیاز به توجه" },
    title:  { nl: "Belasting­gezondheid", en: "Tax Health Score", fa: "امتیاز سلامت مالیاتی" },
    hide:   { nl: "Verberg ↑",     en: "Hide ↑",         fa: "پنهان ↑" },
    show:   { nl: "Zie factoren ↓",en: "See factors ↓",  fa: "مشاهده عوامل ↓" },
  } as const;
  type LangKey = "nl" | "en" | "fa";
  const L = (key: keyof typeof LABELS) => LABELS[key][(lang as LangKey) ?? "en"];
  const label = score >= 80 ? L("good") : score >= 55 ? L("fair") : L("poor");
  const radius = 40; const circ = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>{L("title")}</div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Skeleton height={80} width={80} radius="50%" />
          <div style={{ flex: 1 }}><Skeleton height={14} width="60%" radius="4px" /></div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
              <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={40} cy={40} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={6} />
                <circle cx={40} cy={40} r={radius} fill="none" stroke={color} strokeWidth={6}
                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: 22, color, letterSpacing: "-0.02em" }}>{score}</span>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color, fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3, lineHeight: 1.4 }}>
                Profile, compliance,<br />risks, opportunities
              </div>
              {factors.length > 0 && (
                <button onClick={() => setShowFactors(v => !v)}
                  style={{ marginTop: 8, background: "none", border: "none", fontSize: 11, color: "var(--sage-700)", cursor: "pointer", padding: 0, fontWeight: 500 }}>
                  {showFactors ? L("hide") : L("show")}
                </button>
              )}
            </div>
          </div>
          {showFactors && (
            <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 10 }}>
              {factors.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0" }}>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)", flex: 1, lineHeight: 1.3 }}>{f.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.positive ? "var(--ok)" : "var(--danger)", fontFamily: "var(--mono)" }}>
                    {f.positive ? `+${f.delta}` : f.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FinancialOverviewCard({
  calcResult, loading, userType, lang,
}: { calcResult: CalcResult | null; loading: boolean; userType: string; lang: string }) {
  if (!calcResult && !loading) return null;
  const c = calcResult?.calculation ?? {};
  const r = calcResult?.result ?? ({} as CalcResult["result"]);
  const isZzp = userType === "zzp";
  const income = isZzp ? (c.gross_profit ?? 0) : (c.taxable_income ?? 0);
  const deductions = isZzp ? ((c.ondernemersaftrek ?? 0) + (c.mkb_winstvrijstelling ?? 0)) : 0;
  const credits = (c.ahk ?? 0) + (c.arbeidskorting ?? 0) + (c.iack ?? 0);
  const L = (nl: string, en: string, fa: string) => lang === "nl" ? nl : lang === "fa" ? fa : en;

  type Row = { l: string; v: number; sign?: "+" | "-" };
  const rows: Row[] = [];
  if (isZzp) {
    rows.push({ l: L("Bruto winst", "Gross profit", "سود خالص"), v: income });
    if (deductions > 0) rows.push({ l: L("Aftrekposten", "Deductions", "کسرها"), v: deductions, sign: "-" });
  } else {
    rows.push({ l: L("Belastbaar inkomen", "Taxable income", "درآمد مشمول"), v: income });
  }
  rows.push({ l: L("Box 1 belasting", "Box 1 tax", "مالیات باکس ۱"), v: c.box1_tax ?? 0, sign: "-" });
  if (credits > 0) rows.push({ l: L("Heffingskortingen", "Tax credits", "اعتبارات"), v: credits, sign: "+" });
  if ((c.zvw_contribution ?? 0) > 0) rows.push({ l: L("ZVW-bijdrage", "ZVW health", "ZVW"), v: c.zvw_contribution ?? 0, sign: "-" });
  if ((c.box2_tax ?? 0) > 0) rows.push({ l: L("Box 2", "Box 2", "باکس ۲"), v: c.box2_tax ?? 0, sign: "-" });
  if ((c.box3_tax ?? 0) > 0) rows.push({ l: L("Box 3", "Box 3", "باکس ۳"), v: c.box3_tax ?? 0, sign: "-" });

  // Tax Buffer Estimation — how much should be saved by now vs. reserve
  const totalTax = r.total_tax_due ?? 0;
  const monthlyReserve = r.monthly_reserve_needed ?? 0;
  const currentMonth = new Date().getMonth(); // 0-indexed
  const expectedSaved = Math.round(monthlyReserve * currentMonth);
  const bufferPct = totalTax > 0 && monthlyReserve > 0
    ? Math.min(100, Math.round((expectedSaved / totalTax) * 100))
    : 0;

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
        {L("Financieel overzicht", "Financial overview", "خلاصه مالی")}
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[80, 70, 60, 75].map((w, i) => <Skeleton key={i} height={12} width={`${w}%`} radius="3px" />)}
        </div>
      ) : (
        <>
          {rows.map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--hairline)" : "none",
            }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{row.l}</span>
              <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 500,
                color: row.sign === "-" ? "var(--ink-2)" : row.sign === "+" ? "var(--ok)" : "var(--ink)" }}>
                {row.sign === "-" ? "−" : row.sign === "+" ? "+" : ""}€{Math.abs(Math.round(row.v)).toLocaleString("nl-NL")}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 2, borderTop: "2px solid var(--hairline-2)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{L("Totale belasting", "Total tax", "مجموع مالیات")}</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
              €{Math.round(totalTax).toLocaleString("nl-NL")}
            </span>
          </div>

          {/* Tax Buffer Estimation */}
          {["zzp", "dga"].includes(userType) && monthlyReserve > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {L("Belastingbuffer (verwacht)", "Tax buffer (expected so far)", "بافر مالیاتی")}
                </span>
                <span className="font-mono" style={{ fontSize: 11.5, color: bufferPct >= 50 ? "var(--ok)" : "var(--warn)", fontWeight: 600 }}>
                  {bufferPct}%
                </span>
              </div>
              <div style={{ height: 6, background: "var(--hairline)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${bufferPct}%`,
                  background: bufferPct >= 80 ? "var(--ok)" : bufferPct >= 40 ? "var(--warn)" : "var(--danger)",
                  transition: "width 0.8s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 5 }}>
                {L(
                  `€${expectedSaved.toLocaleString("nl-NL")} verwacht gespaard van €${Math.round(totalTax).toLocaleString("nl-NL")} totaal`,
                  `€${expectedSaved.toLocaleString("nl-NL")} expected saved of €${Math.round(totalTax).toLocaleString("nl-NL")} total`,
                  `€${expectedSaved.toLocaleString("nl-NL")} انتظار پس‌انداز از €${Math.round(totalTax).toLocaleString("nl-NL")} کل`,
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComplianceStatusCard({
  profile, lang,
}: { profile: Record<string, unknown> | null; lang: string }) {
  const items = buildComplianceItems(profile, lang);
  if (items.length === 0) return null;
  const L = (nl: string, en: string, fa: string) => lang === "nl" ? nl : lang === "fa" ? fa : en;
  const allOk = items.every(i => i.ok);

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div className="eyebrow" style={{ color: "var(--ink-3)" }}>{L("Nalevingsstatus", "Compliance status", "وضعیت انطباق")}</div>
        {allOk && <span className="pill pill-ok" style={{ fontSize: 9 }}>✓ OK</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
              {item.ok ? "✅" : "⚠️"}
            </span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: item.ok ? "var(--ink)" : "var(--warn)" }}>
                {item.label}
              </div>
              {item.note && (
                <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{item.note}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentRuleChangesCard({
  changes, loading, lang,
}: { changes: RuleChange[]; loading: boolean; lang: string }) {
  const L = (nl: string, en: string, fa: string) => lang === "nl" ? nl : lang === "fa" ? fa : en;
  const getText = (r: RuleChange) =>
    lang === "nl" ? r.plain_nl : lang === "fa" ? r.plain_fa : r.plain_en;

  if (!loading && changes.length === 0) return null;

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
        {L("Recente regelwijzigingen", "Recent rule changes", "تغییرات اخیر قوانین")}
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height={40} radius="4px" />
          <Skeleton height={40} radius="4px" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {changes.slice(0, 4).map(r => (
            <div key={r.rule_id} style={{ paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--sage-700)", fontFamily: "var(--mono)" }}>
                  {r.rule_id}
                </span>
                <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{r.updated_at}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.4 }}>{getText(r)}</div>
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--sage-700)", textDecoration: "none", marginTop: 4, display: "inline-block" }}>
                  {L("Lees meer", "Read more", "بیشتر بخوانید")} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert, onDismiss, onExplain, onSnooze, onMarkDone, isDone, lang,
}: {
  alert: Alert;
  onDismiss: (id: string) => void;
  onExplain: (title: string, body: string, alertId?: string, category?: string) => void;
  onSnooze: (id: string, days: number) => void;
  onMarkDone: (id: string) => void;
  isDone: boolean;
  lang: string;
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const s = SEV[alert.severity] ?? SEV.info;
  type LK = "nl" | "en" | "fa";
  const lk = (lang as LK) in { nl:1, en:1, fa:1 } ? (lang as LK) : "en";
  const T = {
    markDone:  { nl: "Afgehandeld", en: "Mark done",   fa: "انجام شد" },
    done:      { nl: "✓ Klaar",     en: "✓ Done",      fa: "✓ انجام شد" },
    askAI:     { nl: "Vraag AI →",  en: "Ask AI →",    fa: "از AI بپرس →" },
    snooze:    { nl: "Snoozе ↓",    en: "Snooze ↓",    fa: "تعویق ↓" },
    dismiss:   { nl: "Negeren",     en: "Dismiss",     fa: "نادیده بگیر" },
    tomorrow:  { nl: "Morgen",      en: "Tomorrow",    fa: "فردا" },
    oneWeek:   { nl: "1 week",      en: "1 week",      fa: "۱ هفته" },
    oneMonth:  { nl: "1 maand",     en: "1 month",     fa: "۱ ماه" },
  } as const;

  return (
    <div className="card" style={{
      padding: "14px 16px", background: isDone ? "var(--paper-2)" : s.bg,
      border: `1px solid ${isDone ? "var(--hairline)" : s.border}`,
      display: "flex", gap: 12, alignItems: "flex-start", position: "relative",
      opacity: isDone ? 0.55 : 1, transition: "opacity 0.2s",
    }}>
      <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
        {CAT_ICON[alert.category] ?? "ℹ️"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{alert.title}</span>
          <span style={{ fontSize: 9, padding: "1px 6px", background: s.dot, color: "white", borderRadius: 999, fontWeight: 700, letterSpacing: "0.04em" }}>
            {s.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>{alert.body}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <a href={alert.action_url}
            target={alert.action_url.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            style={{ fontSize: 11.5, color: "var(--sage-700)", fontWeight: 500, textDecoration: "none" }}>
            {alert.action_label} →
          </a>
          <button onClick={() => onMarkDone(alert.id)}
            style={{ background: "none", border: "none", fontSize: 11.5,
              color: isDone ? "var(--ok)" : "var(--ink-3)", cursor: "pointer", padding: 0, fontWeight: isDone ? 600 : 400 }}>
            {isDone ? T.done[lk] : T.markDone[lk]}
          </button>
          <button onClick={() => onExplain(alert.title, alert.body, alert.id, alert.category)}
            style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-3)", cursor: "pointer", padding: 0 }}>
            {T.askAI[lk]}
          </button>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSnoozeMenu(v => !v)}
              aria-label="Snooze this alert"
              style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}>
              {T.snooze[lk]}
            </button>
            {showSnoozeMenu && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "var(--paper-2)",
                border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "6px 0",
                zIndex: 10, minWidth: 120, boxShadow: "var(--shadow-sm)",
              }}>
                {([1, 7, 30] as const).map(d => (
                  <button key={d}
                    onClick={() => { onSnooze(alert.id, d); setShowSnoozeMenu(false); }}
                    style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none",
                      padding: "6px 14px", fontSize: 12, color: "var(--ink)", cursor: "pointer" }}>
                    {d === 1 ? T.tomorrow[lk] : d === 7 ? T.oneWeek[lk] : T.oneMonth[lk]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onDismiss(alert.id)}
            aria-label="Dismiss this alert"
            style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}>
            {T.dismiss[lk]}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  action, state, onMarkDone, onDismiss, onSnooze,
}: {
  action: TaxAction; state: ActionState;
  onMarkDone: (id: string) => void; onDismiss: (id: string) => void;
  onSnooze: (id: string, days: number) => void;
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const pColor = ACTION_PRIORITY_COLOR[action.priority] ?? "var(--sage-600)";
  const isDone = state === "done";

  return (
    <div className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", opacity: isDone ? 0.5 : 1, transition: "opacity 0.2s", position: "relative" }}>
      <button onClick={() => onMarkDone(action.id)} aria-label={isDone ? "Mark open" : "Mark done"}
        style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
          border: `2px solid ${isDone ? "var(--ok)" : "var(--hairline-2)"}`,
          background: isDone ? "var(--ok)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {isDone && <Icon.check />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12 }}>{ACTION_CAT_ICON[action.category] ?? "📌"}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", textDecoration: isDone ? "line-through" : "none" }}>
            {action.title}
          </span>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, fontWeight: 700, letterSpacing: "0.04em",
            background: `${pColor}22`, color: pColor, border: `1px solid ${pColor}44` }}>
            {action.priority.toUpperCase()}
          </span>
          {action.due_date && !isDone && (
            <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>
              Due {new Date(action.due_date).toLocaleDateString("nl-NL")}
            </span>
          )}
        </div>
        {!isDone && <p style={{ fontSize: 12, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>{action.body}</p>}
        {!isDone && (
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            <a href={action.action_url}
              target={action.action_url.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: "var(--sage-700)", fontWeight: 500, textDecoration: "none" }}>
              {action.action_label} →
            </a>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSnoozeMenu(v => !v)}
                style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}>
                Snooze ↓
              </button>
              {showSnoozeMenu && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "var(--paper-2)",
                  border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "6px 0",
                  zIndex: 10, minWidth: 120, boxShadow: "var(--shadow-sm)",
                }}>
                  {[1, 7, 30].map(d => (
                    <button key={d} onClick={() => { onSnooze(action.id, d); setShowSnoozeMenu(false); }}
                      style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none",
                        padding: "6px 14px", fontSize: 12, color: "var(--ink)", cursor: "pointer" }}>
                      {d === 1 ? "Tomorrow" : d === 7 ? "1 week" : "1 month"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onDismiss(action.id)}
              style={{ background: "none", border: "none", fontSize: 11.5, color: "var(--ink-4)", cursor: "pointer", padding: 0 }}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHead({ label, count, badge }: { label: string; count?: number; badge?: "danger" | "warn" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span className="eyebrow eyebrow-accent">{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          background: badge === "danger" ? "var(--danger)" : badge === "warn" ? "var(--warn)" : "var(--sage-600)",
          color: "white" }}>{count}</span>
      )}
    </div>
  );
}

function EmptySection({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{text}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const lang = i18n.language as "nl" | "en" | "fa";
  const isRtl = lang === "fa";

  const [calcResult, setCalcResult]   = useState<CalcResult | null>(null);
  const [alerts, setAlerts]           = useState<Alert[]>([]);
  const [actions, setActions]         = useState<TaxAction[]>([]);
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [ruleChanges, setRuleChanges] = useState<RuleChange[]>([]);
  const [loadingCalc, setLoadingCalc]   = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingChanges, setLoadingChanges] = useState(false);

  const [snoozedAlerts, setSnoozedAlerts] = useState<Set<string>>(() => {
    const now = new Date();
    try {
      const map = JSON.parse(localStorage.getItem("taxwijs_alert_snoozed_until") ?? "{}") as Record<string, string>;
      return new Set(Object.entries(map).filter(([, d]) => new Date(d) > now).map(([id]) => id));
    } catch { return new Set(); }
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("taxwijs_dismissed_alerts") ?? "[]") as string[]); }
    catch { return new Set(); }
  });

  // Alert "done" state — spec: done / dismissed / snoozed
  const [doneAlerts, setDoneAlerts] = useState<Set<string>>(loadDoneAlerts);

  const [actionStates, setActionStates] = useState<Record<string, ActionState>>(loadActionStates);

  // Keep snoozed actions filtered (re-check on mount)
  const snoozedActions = useRef(new Set<string>());
  useEffect(() => {
    const active = new Set<string>();
    Object.keys(loadActionStates()).forEach(id => { if (isSnoozed(id)) active.add(id); });
    snoozedActions.current = active;
  }, []);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(() => {
    try { const r = localStorage.getItem("taxwijs_calc_input"); return r ? JSON.parse(r) as Record<string, unknown> : null; }
    catch { return null; }
  });

  // authHeader imported from api/client.ts — do not re-declare here

  const explainAlert = useCallback((title: string, body: string, alertId?: string, category?: string) => {
    const q = lang === "nl"
      ? `Kun je uitleggen wat dit betekent voor mij: "${title}"`
      : lang === "fa"
      ? `می‌توانی توضیح دهی که این برای من چه معنایی دارد: "${title}"`
      : `Can you explain what this means for me: "${title}"`;
    // Pass structured alert so the backend injects it into the system prompt
    navigate("/chat", { state: { question: q, explain_alert: { id: alertId ?? "", title, body, category: category ?? "" } } });
  }, [lang, navigate]);

  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (!profile) {
      fetch("/api/users/profile/", { headers: authHeader() })
        .then(r => r.ok ? r.json() as Promise<{ intake_profile?: Record<string, unknown> | null }> : null)
        .then(data => { if (data?.intake_profile) { localStorage.setItem("taxwijs_calc_input", JSON.stringify(data.intake_profile)); setProfile(data.intake_profile); } })
        .catch(() => null);
    }
    fetch("/api/calculator/history/", { headers: authHeader() })
      .then(r => r.ok ? r.json() as Promise<HistoryItem[]> : [])
      .then(setHistory).catch(() => null);
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    setLoadingCalc(true);
    fetch("/api/calculator/calculate/", {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(profile),
    }).then(r => r.json() as Promise<CalcResult>).then(result => {
      setCalcResult(result);
      // Persist snapshot to backend for authenticated users (health score history)
      if (user) {
        fetch("/api/users/snapshots/", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ tax_year: 2026, profile_snapshot: profile, calc_snapshot: result, source: "auto", is_final: false }),
        }).catch(() => null);
      }
    }).catch(() => null).finally(() => setLoadingCalc(false));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    setLoadingAlerts(true);
    fetch("/api/users/alerts/", {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ profile, lang }),
    }).then(r => r.ok ? r.json() as Promise<Alert[]> : [])
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoadingAlerts(false));
  }, [profile, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    setLoadingActions(true);
    fetchActions(profile, lang).then(setActions).catch(() => setActions([])).finally(() => setLoadingActions(false));
  }, [profile, lang]);

  // ── Server state hydration (authenticated users) ───────────────────────────
  // On mount, pull persisted states from backend and merge into local state.
  // This ensures dismiss/snooze/done survive browser clears and device switches.
  useEffect(() => {
    if (!user) return;
    fetchServerStates().then(server => {
      if (!server) return;
      const now = new Date();

      // Alerts: merge server state into local sets
      const donSet   = new Set(loadDoneAlerts());
      const dismissSet = new Set<string>();
      const snoozeMap: Record<string, string> = {};

      Object.entries(server.alerts).forEach(([id, { state, snoozed_until }]) => {
        if (state === "done")      donSet.add(id);
        if (state === "dismissed") dismissSet.add(id);
        if (state === "snoozed" && snoozed_until) snoozeMap[id] = snoozed_until;
      });
      setDoneAlerts(donSet);
      setDismissedAlerts(prev => new Set([...prev, ...dismissSet]));
      setSnoozedAlerts(prev => {
        const next = new Set(prev);
        Object.entries(snoozeMap).forEach(([id, d]) => { if (new Date(d) > now) next.add(id); });
        return next;
      });
      localStorage.setItem("taxwijs_dismissed_alerts", JSON.stringify([...dismissSet]));
      localStorage.setItem("taxwijs_alert_snoozed_until", JSON.stringify(snoozeMap));

      // Actions: merge server state into actionStates map
      const actionMap: Record<string, ActionState> = { ...loadActionStates() };
      const actionSnoozeMap: Record<string, string> = {};
      Object.entries(server.actions).forEach(([id, { state, snoozed_until }]) => {
        actionMap[id] = state;
        if (state === "snoozed" && snoozed_until) actionSnoozeMap[id] = snoozed_until;
      });
      setActionStates(actionMap);
      localStorage.setItem("taxwijs_action_states", JSON.stringify(actionMap));
      if (Object.keys(actionSnoozeMap).length) {
        const existing = JSON.parse(localStorage.getItem("taxwijs_snoozed_until") ?? "{}") as Record<string, string>;
        localStorage.setItem("taxwijs_snoozed_until", JSON.stringify({ ...existing, ...actionSnoozeMap }));
      }
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    const userType = String(profile.user_type ?? "");
    setLoadingChanges(true);
    fetch(`/api/tax/rules/changes/?user_type=${userType}&days=30`, { headers: authHeader() })
      .then(r => r.ok ? r.json() as Promise<RuleChange[]> : [])
      .then(setRuleChanges).catch(() => setRuleChanges([]))
      .finally(() => setLoadingChanges(false));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Alert handlers ─────────────────────────────────────────────────────────
  function markAlertDone(id: string) {
    const isDone = doneAlerts.has(id);
    const next = new Set(doneAlerts);
    if (isDone) next.delete(id); else next.add(id);
    setDoneAlerts(next);
    persistDoneAlerts(next);
    const newState = isDone ? "open" : "done";
    persistStateToServer("alert", id, newState);
  }

  function dismissAlert(id: string) {
    const next = new Set([...dismissedAlerts, id]);
    setDismissedAlerts(next);
    localStorage.setItem("taxwijs_dismissed_alerts", JSON.stringify([...next]));
    persistStateToServer("alert", id, "dismissed");
  }

  function handleSnoozeAlert(id: string, days: number) {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const untilStr = until.toISOString().slice(0, 10);
    snoozeAlert(id, days);
    setSnoozedAlerts(prev => new Set([...prev, id]));
    persistStateToServer("alert", id, "snoozed", untilStr);
  }

  function markActionDone(id: string) {
    const next = actionStates[id] === "done" ? "open" : "done";
    const updated = { ...actionStates, [id]: next as ActionState };
    setActionStates(updated);
    saveActionState(id, next as ActionState);
    persistStateToServer("action", id, next as ActionState);
  }

  function dismissAction(id: string) {
    const updated = { ...actionStates, [id]: "dismissed" as ActionState };
    setActionStates(updated);
    saveActionState(id, "dismissed");
    persistStateToServer("action", id, "dismissed");
  }

  function handleSnoozeAction(id: string, days: number) {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const untilStr = until.toISOString().slice(0, 10);
    snoozeItem(id, days);
    snoozedActions.current.add(id);
    setActionStates(prev => ({ ...prev }));
    persistStateToServer("action", id, "snoozed", untilStr);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const userType     = String(profile?.user_type ?? "");
  const totalTax     = calcResult?.result.total_tax_due ?? 0;
  const effectiveRate= calcResult?.result.effective_rate ?? 0;
  const monthlyRsrv  = calcResult?.result.monthly_reserve_needed ?? 0;
  const wetDba       = calcResult?.result.wet_dba_risk ?? "";

  // Spec: done / dismissed / snoozed — done alerts are dimmed in section, not hidden
  const visibleAlerts  = alerts.filter(a => !dismissedAlerts.has(a.id) && !snoozedAlerts.has(a.id));
  const activeAlerts   = visibleAlerts.filter(a => !doneAlerts.has(a.id));
  const riskAlerts     = visibleAlerts.filter(a => ["risk", "compliance"].includes(a.category));
  const deadlineAlerts = visibleAlerts.filter(a => a.category === "deadline");
  const oppAlerts      = visibleAlerts.filter(a => ["opportunity", "missing_data", "cashflow"].includes(a.category));
  const ruleChangeAlerts = visibleAlerts.filter(a => a.category === "rule_change");
  const criticalCount  = activeAlerts.filter(a => a.severity === "critical").length;

  const visibleActions = actions.filter(a => actionStates[a.id] !== "dismissed" && !snoozedActions.current.has(a.id));
  const openActions    = visibleActions.filter(a => actionStates[a.id] !== "done");
  const doneActions    = visibleActions.filter(a => actionStates[a.id] === "done");

  const { score: healthScore, factors: healthFactors } = useMemo(
    () => computeHealthScore(profile, visibleAlerts, calcResult),
    [profile, visibleAlerts, calcResult] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const deadlineLabel = (d: typeof STATIC_DEADLINES[0]) => d.label[lang] ?? d.label.en;

  const L = (nl: string, en: string, fa: string) => lang === "nl" ? nl : lang === "fa" ? fa : en;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ flex: 1, padding: isMobile ? "24px 16px" : "40px 28px", maxWidth: 1120, margin: "0 auto", width: "100%" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow eyebrow-accent">{L("Dashboard", "Dashboard", "داشبورد")}</div>
        <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: isMobile ? 26 : 34, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {L("Welkom terug", "Welcome back", "خوش آمدید")}
          {user?.email && <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: "0.62em" }}>, {user.email.split("@")[0]}</span>}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {user?.plan === "premium" && <span className="pill pill-accent">⚡ Premium</span>}
          {criticalCount > 0 && (
            <span className="pill pill-danger" style={{ cursor: "pointer" }}
              onClick={() => document.getElementById("risks-section")?.scrollIntoView({ behavior: "smooth" })}>
              ⚠ {criticalCount} {L(`kritische melding${criticalCount !== 1 ? "en" : ""}`, `critical alert${criticalCount !== 1 ? "s" : ""}`, "هشدار بحرانی")}
            </span>
          )}
          {openActions.length > 0 && (
            <span className="pill" style={{ background: "var(--sage-600)", color: "white", cursor: "pointer" }}
              onClick={() => document.getElementById("actions-section")?.scrollIntoView({ behavior: "smooth" })}>
              {openActions.length} {L("openstaande actie(s)", "open action(s)", "کار باز")}
            </span>
          )}
        </div>
      </div>

      {/* ── No-profile banner ──────────────────────────────────────────────── */}
      {!profile && (
        <div className="card" style={{ padding: "22px 24px", marginBottom: 28, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{L("Profiel niet ingesteld", "Profile not set up", "پروفایل تنظیم نشده")}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{L("Stel uw profiel in voor een gepersonaliseerd belastingoverzicht", "Set up your profile to get your personalised tax overview", "پروفایل خود را تنظیم کنید")}</div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => navigate("/intake")}>
            {L("Profiel instellen", "Set up profile", "تنظیم پروفایل")} <Icon.arrow />
          </button>
        </div>
      )}

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      {profile && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <SummaryCard title={L("Totale belasting", "Total tax", "مجموع مالیات")} value={`€${Math.round(totalTax).toLocaleString("nl-NL")}`} subtitle="2026" accent loading={loadingCalc} />
          <SummaryCard title={L("Effectief tarief", "Effective rate", "نرخ مؤثر")} value={loadingCalc ? "—" : `${(effectiveRate * 100).toFixed(1)}%`} subtitle={loadingCalc ? undefined : `~€${Math.round(effectiveRate * 100)} per €100`} loading={loadingCalc} />
          <SummaryCard title={L("Maandelijks reserveren", "Monthly reserve", "ذخیره ماهانه")} value={`€${Math.round(monthlyRsrv).toLocaleString("nl-NL")}`} subtitle={L("Apart zetten", "Set aside", "کنار بگذارید")} loading={loadingCalc} />
          {userType === "zzp" ? (
            <SummaryCard title={L("Wet DBA risico", "Wet DBA risk", "ریسک Wet DBA")}
              value={wetDba ? wetDba.charAt(0).toUpperCase() + wetDba.slice(1).toLowerCase() : "—"}
              subtitle={wetDba ? undefined : L("Nog niet berekend", "Not yet calculated", "هنوز محاسبه نشده")}
              valueColor={wetDba === "high" ? "var(--danger)" : wetDba === "medium" ? "var(--warn)" : wetDba === "low" ? "var(--ok)" : undefined}
              loading={loadingCalc} />
          ) : (
            <SummaryCard title="Tax Health" value={loadingCalc || loadingAlerts ? "—" : String(healthScore)}
              subtitle={healthScore >= 80 ? "Good" : healthScore >= 55 ? "Fair" : "Needs attention"}
              valueColor={healthScore >= 80 ? "var(--ok)" : healthScore >= 55 ? "var(--warn)" : "var(--danger)"}
              loading={loadingCalc || loadingAlerts} />
          )}
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "flex-start" }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Action Feed */}
          {profile && (
            <div id="actions-section">
              <SectionHead label={L("Uw acties", "Your actions", "اقدامات شما")} count={openActions.length} />
              {loadingActions ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1,2,3].map(i => <Skeleton key={i} height={64} radius="var(--r-lg)" />)}
                </div>
              ) : visibleActions.length === 0 ? (
                <EmptySection icon="✓" text={L("Geen openstaande acties", "No open actions", "هیچ کاری باز نیست")} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {openActions.map(action => (
                    <ActionCard key={action.id} action={action} state={actionStates[action.id] ?? "open"}
                      onMarkDone={markActionDone} onDismiss={dismissAction} onSnooze={handleSnoozeAction} />
                  ))}
                  {doneActions.length > 0 && (
                    <details style={{ marginTop: 4 }}>
                      <summary style={{ fontSize: 12, color: "var(--ink-4)", cursor: "pointer", padding: "6px 0", userSelect: "none" }}>
                        {doneActions.length} {L("voltooid", "completed", "انجام‌شده")}
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {doneActions.map(action => (
                          <ActionCard key={action.id} action={action} state="done"
                            onMarkDone={markActionDone} onDismiss={dismissAction} onSnooze={handleSnoozeAction} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Risks */}
          {profile && (
            <div id="risks-section">
              <SectionHead label={L("Risico's", "Risks", "ریسک‌ها")} count={riskAlerts.length} badge={criticalCount > 0 ? "danger" : riskAlerts.length > 0 ? "warn" : undefined} />
              {loadingAlerts
                ? <Skeleton height={72} radius="var(--r-lg)" />
                : riskAlerts.length === 0
                ? <EmptySection icon="✓" text={L("Geen actieve risico's", "No active risks", "هیچ ریسکی ندارید")} />
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {riskAlerts.map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} onExplain={explainAlert} onSnooze={handleSnoozeAlert} onMarkDone={markAlertDone} isDone={doneAlerts.has(a.id)} lang={lang} />)}
                  </div>
              }
            </div>
          )}

          {/* Deadlines (from alert engine — near-term only) */}
          {profile && deadlineAlerts.length > 0 && (
            <div>
              <SectionHead label={L("Aankomende deadlines", "Upcoming deadlines", "مهلت‌های نزدیک")} count={deadlineAlerts.length} badge="warn" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deadlineAlerts.map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} onExplain={explainAlert} onSnooze={handleSnoozeAlert} onMarkDone={markAlertDone} isDone={doneAlerts.has(a.id)} lang={lang} />)}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {profile && (
            <div>
              <SectionHead label={L("Kansen", "Opportunities", "فرصت‌ها")} count={oppAlerts.length} />
              {loadingAlerts
                ? <Skeleton height={72} radius="var(--r-lg)" />
                : oppAlerts.length === 0
                ? <EmptySection icon="💡" text={L("Geen onbenutte kansen gevonden", "No untapped opportunities found", "هیچ فرصت باز یافت نشد")} />
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {oppAlerts.map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} onExplain={explainAlert} onSnooze={handleSnoozeAlert} onMarkDone={markAlertDone} isDone={doneAlerts.has(a.id)} lang={lang} />)}
                  </div>
              }
            </div>
          )}

          {/* Rule Change Alerts — spec: "Recent Rule Changes" as active alert section */}
          {profile && ruleChangeAlerts.length > 0 && (
            <div id="rule-changes-section">
              <SectionHead label={L("Regelwijzigingen", "Rule changes", "تغییر قوانین")} count={ruleChangeAlerts.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ruleChangeAlerts.map(a => (
                  <AlertCard key={a.id} alert={a}
                    onDismiss={dismissAlert} onExplain={explainAlert}
                    onSnooze={handleSnoozeAlert} onMarkDone={markAlertDone}
                    isDone={doneAlerts.has(a.id)} lang={lang} />
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="eyebrow" style={{ marginBottom: 14, color: "var(--ink-3)" }}>{L("Snelle acties", "Quick actions", "اقدامات سریع")}</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {[
                { icon: "spark", label: L("Vraag de assistent", "Ask the assistant", "از دستیار بپرسید"), to: "/chat", primary: true },
                { icon: "edit",  label: L("Profiel bijwerken", "Update profile", "به‌روزرسانی پروفایل"), to: "/intake" },
                { icon: "info",  label: L("IB-aangifte gids", "IB return guide", "راهنمای اظهارنامه"), to: "/ib-guide" },
                { icon: "chev",  label: L("Belasting simulatie", "Tax simulation", "شبیه‌سازی مالیات"), to: "/simulation" },
              ].map(action => (
                <button key={action.to} onClick={() => navigate(action.to)}
                  className={action.primary ? "btn btn-accent" : "btn btn-soft btn-sm"}
                  style={{ justifyContent: "flex-start", gap: 8, textAlign: "start" }}>
                  {action.icon === "spark" && <Icon.spark />}
                  {action.icon === "edit"  && <Icon.edit />}
                  {action.icon === "info"  && <Icon.info />}
                  {action.icon === "chev"  && <Icon.chev />}
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card" style={{ padding: "20px 22px" }}>
              <div className="eyebrow" style={{ marginBottom: 14, color: "var(--ink-3)" }}>{L("Berekeningen", "History", "تاریخچه")}</div>
              {history.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{String(item.input_snapshot?.user_type ?? "").toUpperCase()} · {item.tax_year}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{new Date(item.created_at).toLocaleDateString(lang === "nl" ? "nl-NL" : lang === "fa" ? "fa-IR" : "en-GB")}</div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="font-mono" style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>€{Math.round(item.total_tax_due).toLocaleString("nl-NL")}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{(item.effective_rate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <TaxHealthScoreCard score={healthScore} loading={loadingCalc || loadingAlerts} factors={healthFactors} lang={lang} />

          {/* PDF Tax Health Report download */}
          {profile && <PDFDownloadCard lang={lang} />}

          <FinancialOverviewCard calcResult={calcResult} loading={loadingCalc} userType={userType} lang={lang} />

          <ComplianceStatusCard profile={profile} lang={lang} />

          <RecentRuleChangesCard changes={ruleChanges} loading={loadingChanges} lang={lang} />

          {/* Profile card */}
          {profile && (
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="eyebrow" style={{ color: "var(--ink-3)" }}>{L("Uw profiel", "Your profile", "پروفایل شما")}</div>
                <button onClick={() => navigate("/intake")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}><Icon.edit /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: L("Type", "Type", "نوع"), value: String(profile.user_type ?? "").toUpperCase() },
                  { label: L("Inkomen", "Income", "درآمد"), value: `€${((Number(profile.annual_revenue_zzp) || Number(profile.employment_income) || 0)).toLocaleString("nl-NL")}` },
                  profile.has_partner !== undefined ? { label: L("Partner", "Partner", "شریک"), value: profile.has_partner ? L("Ja","Yes","بله") : L("Nee","No","خیر") } : null,
                  Number(profile.children_under_12) > 0 ? { label: L("Kinderen","Children","فرزندان"), value: String(profile.children_under_12) } : null,
                ].filter(Boolean).map(row => row && (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)" }}>{row.label}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static deadlines */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>{L("Aankomende deadlines", "Upcoming deadlines", "مهلت‌های پیش رو")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STATIC_DEADLINES.map(d => (
                <div key={d.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{deadlineLabel(d)}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{d.date}</div>
                  </div>
                  <span className={`pill pill-${d.urgency}`} style={{ fontSize: 10, flexShrink: 0 }}>{d.urgency === "warn" ? "!" : "✓"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="card" style={{ padding: "18px 22px" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 10 }}>{L("Account", "Account", "حساب کاربری")}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{user?.email}</div>
            <div style={{ marginTop: 6 }}>
              {user?.plan === "premium"
                ? <span className="pill pill-accent">⚡ Premium</span>
                : <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <span className="pill" style={{ fontSize: 10.5 }}>Free</span>
                    <button onClick={() => navigate("/pricing")}
                      style={{ background: "none", border: "none", fontSize: 12, color: "var(--sage-700)", fontWeight: 500, cursor: "pointer", padding: 0 }}>
                      {L("Upgrade →", "Upgrade →", "ارتقاء →")}
                    </button>
                  </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
