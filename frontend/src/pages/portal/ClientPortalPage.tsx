import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { fetchClientProfile, fetchClientEngagement, fetchClientTasks } from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";

const TX = {
  title:       { nl: "Mijn Belastingportaal", en: "My Tax Portal", fa: "پورتال مالیاتی من" },
  welcome:     { nl: "Welkom", en: "Welcome", fa: "خوش آمدید" },
  readiness:   { nl: "Gereedheid", en: "Readiness", fa: "آمادگی" },
  tasks:       { nl: "Taken", en: "Tasks", fa: "وظایف" },
  documents:   { nl: "Documenten", en: "Documents", fa: "اسناد" },
  open:        { nl: "Openstaand", en: "Open", fa: "باز" },
  status:      { nl: "Status", en: "Status", fa: "وضعیت" },
  year:        { nl: "Belastingjaar", en: "Tax year", fa: "سال مالیاتی" },
  type:        { nl: "Type", en: "Type", fa: "نوع" },
  viewTasks:   { nl: "Bekijk taken", en: "View tasks", fa: "مشاهده وظایف" },
  viewDocs:    { nl: "Bekijk documenten", en: "View documents", fa: "مشاهده اسناد" },
  noEng:       { nl: "Geen actieve aangifte gevonden. Neem contact op met uw accountant.", en: "No active engagement found. Contact your accountant.", fa: "هیچ تعاملی یافت نشد. با حسابدار خود تماس بگیرید." },
  uploadView:  { nl: "Uploaden & bekijken", en: "Upload & view", fa: "بارگذاری و مشاهده" },
};

function t(key: keyof typeof TX, lang: "nl" | "en" | "fa") { return TX[key][lang]; }

export default function ClientPortalPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isMobile = useMobile();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [taskSummary, setTaskSummary] = useState<{ total: number; completed: number; readiness_score: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = setInterval(() => void load(true), 10_000);
    return () => clearInterval(id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [p, e, tasks] = await Promise.all([
        fetchClientProfile(),
        fetchClientEngagement(),
        fetchClientTasks(),
      ]);
      setProfile(p);
      setEngagement(e);
      setTaskSummary(tasks);
      setLastUpdated(new Date());
    } catch {
      if (!silent) setError("Portal not available — contact your accountant");
    }
    if (!silent) setLoading(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</main>
  );

  if (!engagement || !profile) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <p style={{ color: "var(--ink-3)" }}>{error || t("noEng", lang)}</p>
    </main>
  );

  const score = taskSummary?.readiness_score ?? engagement.readiness_score;
  const scoreColor = score >= 85 ? "var(--sage-600)" : score >= 50 ? "oklch(0.62 0.13 50)" : "var(--danger)";

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>
        <div style={{ marginBottom: "var(--sp-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <p style={{ fontFamily: "var(--serif)", fontSize: "var(--text-sm)", color: "var(--ink-4)", margin: "0 0 4px" }}>{t("welcome", lang)},</p>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              {profile.display_name}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              onClick={() => void load(true)}
              title="Refresh"
              style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", fontSize: 14, padding: "3px 8px", lineHeight: 1 }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* Readiness ring + summary */}
        <div className="card" style={{ padding: "var(--sp-6)", marginBottom: "var(--sp-5)", display: "flex", gap: "var(--sp-8)", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--hairline)" strokeWidth={8} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={scoreColor} strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <div style={{ marginTop: 8, fontSize: "var(--text-2xl)", fontWeight: 700, color: scoreColor }}>{score}%</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{t("readiness", lang)}</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)", fontSize: "var(--text-xs)" }}>
              {[
                [t("year", lang), String(engagement.tax_year)],
                [t("type", lang), engagement.engagement_type],
                [t("status", lang), engagement.status],
                [t("tasks", lang), taskSummary ? `${taskSummary.completed} / ${taskSummary.total}` : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "var(--sp-2)", background: "var(--paper-3)", borderRadius: "var(--r-sm)" }}>
                  <div style={{ color: "var(--ink-4)", marginBottom: 2 }}>{k}</div>
                  <div style={{ color: "var(--ink)", fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
          <Link to="/client/tasks" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--sp-5)", cursor: "pointer", borderTop: "3px solid var(--sage-600)", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}>
              <div style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--sp-2)" }}>✓</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-1)" }}>{t("tasks", lang)}</div>
              {taskSummary && (
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-3)" }}>
                  {taskSummary.total - taskSummary.completed} {t("open", lang)}
                </div>
              )}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--sage-600)", fontWeight: 600 }}>{t("viewTasks", lang)} →</span>
            </div>
          </Link>

          <Link to="/client/documents" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--sp-5)", cursor: "pointer", borderTop: "3px solid var(--sage-600)", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}>
              <div style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--sp-2)" }}>📄</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", fontWeight: 400, color: "var(--ink)", marginBottom: "var(--sp-1)" }}>{t("documents", lang)}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: "var(--sp-3)" }}>{t("uploadView", lang)}</div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--sage-600)", fontWeight: 600 }}>{t("viewDocs", lang)} →</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
