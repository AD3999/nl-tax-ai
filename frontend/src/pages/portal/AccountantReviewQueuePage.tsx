import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, FileText, TrendingUp, Filter, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMobile } from "../../hooks/useMobile";
import { fetchEngagements } from "../../api/portal/client";
import type { TaxEngagement, RiskLevel } from "../../api/portal/types";

type Priority = "high" | "medium" | "low";
type SortKey = "risk" | "deadline" | "readiness";

const RISK_COLOR: Record<RiskLevel, string> = {
  high:   "var(--danger)",
  medium: "var(--warn)",
  low:    "var(--ok)",
};

const RISK_BG: Record<RiskLevel, string> = {
  high:   "var(--danger-subtle)",
  medium: "var(--warn-subtle)",
  low:    "var(--ok-subtle)",
};

function getPriority(eng: TaxEngagement): Priority {
  if (eng.risk_level === "high" || eng.missing_items_count > 5) return "high";
  if (eng.risk_level === "medium" || eng.missing_items_count > 2) return "medium";
  return "low";
}

function getRiskScore(eng: TaxEngagement): number {
  return (eng.risk_level === "high" ? 3 : eng.risk_level === "medium" ? 2 : 1) * 10
       + eng.missing_items_count
       - Math.round(eng.readiness_score / 10);
}

export default function AccountantReviewQueuePage() {
  const { i18n } = useTranslation();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";

  const [engagements, setEngagements] = useState<TaxEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  useEffect(() => {
    setLoading(true);
    fetchEngagements()
      .then(list => setEngagements(list))
      .catch(err => setError(err instanceof Error ? err.message : "Failed to load queue"))
      .finally(() => setLoading(false));
  }, []);

  const T = {
    title:    { nl: "Beoordelingswachtrij", en: "Review Queue", fa: "صف بررسی" },
    subtitle: { nl: "Prioriteit op risico, betrouwbaarheid en deadline", en: "Prioritised by risk, confidence, and deadline", fa: "اولویت‌بندی بر اساس ریسک، اعتماد و مهلت" },
    sort:     { nl: "Sorteren op", en: "Sort by", fa: "مرتب‌سازی بر اساس" },
    risk:     { nl: "Risico", en: "Risk", fa: "ریسک" },
    deadline: { nl: "Deadline", en: "Deadline", fa: "مهلت" },
    readiness: { nl: "Gereedheid", en: "Readiness", fa: "آمادگی" },
    all:      { nl: "Alle prioriteiten", en: "All priorities", fa: "همه اولویت‌ها" },
    high:     { nl: "Hoog", en: "High", fa: "بالا" },
    medium:   { nl: "Gemiddeld", en: "Medium", fa: "متوسط" },
    low:      { nl: "Laag", en: "Low", fa: "پایین" },
    missing:  { nl: "ontbrekend", en: "missing", fa: "ناقص" },
    review:   { nl: "Beoordelen", en: "Review", fa: "بررسی" },
    empty:    { nl: "Geen engagements in wachtrij", en: "No engagements in queue", fa: "هیچ تعاملی در صف نیست" },
    kpiClients:  { nl: "Klanten", en: "Total clients", fa: "مشتریان" },
    kpiHigh:     { nl: "Hoog risico", en: "High risk", fa: "ریسک بالا" },
    kpiMissing:  { nl: "Ontbreekt", en: "Missing docs", fa: "اسناد ناقص" },
    kpiReady:    { nl: "Klaar", en: "Ready to file", fa: "آماده ارسال" },
  };

  const t = (k: keyof typeof T) => T[k][lang];

  // Sort + filter
  const sorted = [...engagements]
    .filter(e => filterPriority === "all" || getPriority(e) === filterPriority)
    .sort((a, b) => {
      if (sortKey === "risk")     return getRiskScore(b) - getRiskScore(a);
      if (sortKey === "readiness") return a.readiness_score - b.readiness_score;
      if (sortKey === "deadline") {
        const da = a.deadline_date ?? "9999";
        const db = b.deadline_date ?? "9999";
        return da.localeCompare(db);
      }
      return 0;
    });

  // KPI row
  const totalClients = engagements.length;
  const highRisk = engagements.filter(e => e.risk_level === "high").length;
  const totalMissing = engagements.reduce((sum, e) => sum + e.missing_items_count, 0);
  const readyToFile = engagements.filter(e => e.status === "ready_to_file").length;

  if (loading) return (
    <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-3)" }}>
      {lang === "fa" ? "در حال بارگذاری..." : lang === "nl" ? "Laden..." : "Loading queue..."}
    </div>
  );

  if (error) return (
    <div style={{ padding: "var(--sp-8)", textAlign: "center" }}>
      <AlertTriangle size={32} style={{ color: "var(--warn)", marginBottom: 12 }} />
      <p style={{ color: "var(--text-2)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ padding: "var(--sp-6)", maxWidth: 1100, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: "0 0 var(--sp-1)", letterSpacing: "-0.03em" }}>
          {t("title")}
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: 0 }}>{t("subtitle")}</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        {[
          { label: t("kpiClients"),  value: totalClients, color: "var(--blue)",   icon: <FileText size={16} /> },
          { label: t("kpiHigh"),     value: highRisk,      color: "var(--danger)", icon: <AlertTriangle size={16} /> },
          { label: t("kpiMissing"),  value: totalMissing,  color: "var(--warn)",   icon: <Clock size={16} /> },
          { label: t("kpiReady"),    value: readyToFile,   color: "var(--ok)",     icon: <TrendingUp size={16} /> },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: "var(--sp-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Sort + filter bar */}
      <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
        <Filter size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", fontWeight: 600 }}>{t("sort")}:</span>
        {(["risk", "deadline", "readiness"] as SortKey[]).map(key => (
          <button key={key} onClick={() => setSortKey(key)}
            style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, cursor: "pointer",
              background: sortKey === key ? "var(--blue)" : "var(--bg-3)",
              color: sortKey === key ? "#fff" : "var(--text-3)",
              border: `1px solid ${sortKey === key ? "var(--blue)" : "var(--border-2)"}` }}>
            {t(key as keyof typeof T)}
          </button>
        ))}
        <div style={{ marginInlineStart: "auto", display: "flex", gap: "var(--sp-2)" }}>
          {(["all", "high", "medium", "low"] as const).map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, cursor: "pointer",
                background: filterPriority === p ? "var(--bg-3)" : "transparent",
                color: p === "high" ? "var(--danger)" : p === "medium" ? "var(--warn)" : p === "low" ? "var(--ok)" : "var(--text-3)",
                border: `1px solid ${filterPriority === p ? "var(--border-2)" : "transparent"}` }}>
              {t(p as keyof typeof T)}
            </button>
          ))}
        </div>
      </div>

      {/* Queue list */}
      {sorted.length === 0 ? (
        <div className="card" style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-3)" }}>
          <FileText size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{t("empty")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {sorted.map((eng) => {
            const priority = getPriority(eng);
            const riskColor = RISK_COLOR[eng.risk_level];
            const riskBg = RISK_BG[eng.risk_level];
            const daysUntilDeadline = eng.deadline_date
              ? Math.ceil((new Date(eng.deadline_date).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <Link key={eng.id} to={`/accountant/engagements/${eng.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{
                  padding: "var(--sp-4) var(--sp-5)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-4)",
                  cursor: "pointer",
                  transition: "box-shadow 150ms",
                  borderInlineStart: `4px solid ${riskColor}`,
                }}>
                  {/* Priority dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: priority === "high" ? "var(--danger)" : priority === "medium" ? "var(--warn)" : "var(--ok)", flexShrink: 0 }} />

                  {/* Client name + engagement info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {eng.client_profile_display}
                    </div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{eng.tax_year}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>·</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{eng.engagement_type}</span>
                      {eng.missing_items_count > 0 && (
                        <>
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>·</span>
                          <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>
                            {eng.missing_items_count} {t("missing")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Readiness bar */}
                  {!isMobile && (
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3, fontWeight: 600 }}>{eng.readiness_score}%</div>
                      <div style={{ height: 4, background: "var(--border-2)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${eng.readiness_score}%`, background: eng.readiness_score >= 85 ? "var(--ok)" : eng.readiness_score >= 50 ? "var(--warn)" : "var(--danger)", borderRadius: 999 }} />
                      </div>
                    </div>
                  )}

                  {/* Risk badge */}
                  <div style={{ background: riskBg, color: riskColor, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                    {t(eng.risk_level as keyof typeof T)}
                  </div>

                  {/* Deadline */}
                  {daysUntilDeadline !== null && !isMobile && (
                    <div style={{ fontSize: 11, color: daysUntilDeadline <= 7 ? "var(--danger)" : "var(--text-3)", fontWeight: 600, flexShrink: 0 }}>
                      <Clock size={10} style={{ verticalAlign: "middle", marginInlineEnd: 3 }} />
                      {daysUntilDeadline}d
                    </div>
                  )}

                  <ChevronRight size={14} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
