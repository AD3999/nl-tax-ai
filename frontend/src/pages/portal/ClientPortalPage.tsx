import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckSquare, FolderOpen } from "lucide-react";
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
  settingUp:   { nl: "Portal instellen…", en: "Setting up your portal…", fa: "در حال راه‌اندازی پورتال…" },
  retry:       { nl: "Opnieuw proberen", en: "Retry", fa: "تلاش مجدد" },
};

function t(key: keyof typeof TX, lang: "nl" | "en" | "fa") { return TX[key][lang]; }

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-4)" }}>
      <div className="skel" style={{ height: 14, width: "40%", marginBottom: 12 }} />
      <div className="skel" style={{ height: 10, width: "70%", marginBottom: 8 }} />
      <div className="skel" style={{ height: 10, width: "55%" }} />
    </div>
  );
}

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
    const id = setInterval(() => void load(true), 15_000);
    return () => clearInterval(id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      // Fetch all three — backend auto-creates profile+engagement if missing
      const [p, e, tasks] = await Promise.all([
        fetchClientProfile(),
        fetchClientEngagement(),
        fetchClientTasks(),
      ]);
      setProfile(p);
      setEngagement(e);
      setTaskSummary(tasks);
      setLastUpdated(new Date());
      if (!silent) setError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!silent) setError(msg.includes("403") || msg.includes("401")
        ? "Session expired — please log in again."
        : "Could not load portal data. Please try again.");
    }
    if (!silent) setLoading(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8) var(--sp-6)", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div className="skel" style={{ height: 18, width: 240, marginBottom: 24 }} />
      <SkeletonCard />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );

  if (error) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: "var(--text-2)", fontSize: "var(--text-base)", marginBottom: 20 }}>{error}</p>
      <button className="btn btn-accent btn-sm" onClick={() => void load()}>{t("retry", lang)}</button>
    </main>
  );

  if (!profile || !engagement) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
      <p style={{ color: "var(--text-2)", marginBottom: 20 }}>{t("settingUp", lang)}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => void load()}>{t("retry", lang)}</button>
    </main>
  );

  const score = taskSummary?.readiness_score ?? engagement.readiness_score;
  const scoreColor = score >= 85 ? "var(--ok)" : score >= 50 ? "var(--warn)" : "var(--danger)";
  const scoreBg   = score >= 85 ? "var(--ok-subtle)" : score >= 50 ? "var(--warn-subtle)" : "var(--danger-subtle)";

  return (
    <main style={{ background: "var(--bg)", flex: 1 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: "0 0 4px", fontWeight: 600 }}>{t("welcome", lang)},</p>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>
              {profile.display_name || profile.email}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>{lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              onClick={() => void load(true)}
              title="Refresh"
              style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", fontSize: 16, width: 34, height: 34, display: "grid", placeItems: "center" }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* Readiness ring + summary */}
        <div className="card" style={{ padding: "var(--sp-6)", marginBottom: "var(--sp-5)", display: "flex", gap: "var(--sp-8)", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--border-2)" strokeWidth={8} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={scoreColor} strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>
            <div style={{ marginTop: 4, fontSize: "var(--text-2xl)", fontWeight: 800, color: scoreColor }}>{score}%</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", fontWeight: 600 }}>{t("readiness", lang)}</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)", fontSize: "var(--text-sm)" }}>
              {[
                [t("year", lang),   String(engagement.tax_year)],
                [t("type", lang),   engagement.engagement_type],
                [t("status", lang), engagement.status],
                [t("tasks", lang),  taskSummary ? `${taskSummary.completed} / ${taskSummary.total}` : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--text-3)", marginBottom: 3, fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                  <div style={{ color: "var(--text)", fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score banner */}
        {score < 100 && (
          <div style={{ background: scoreBg, border: `1px solid ${scoreColor}40`, borderRadius: "var(--r)", padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-5)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: scoreColor, flexShrink: 0 }} />
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", fontWeight: 600 }}>
              {score >= 85
                ? (lang === "nl" ? "Bijna klaar om in te dienen!" : lang === "fa" ? "تقریباً آماده برای ارسال!" : "Almost ready to file!")
                : score >= 50
                  ? (lang === "nl" ? "Goed op weg — nog een paar stappen te gaan." : lang === "fa" ? "در مسیر درست — چند مرحله دیگر." : "On track — a few more steps to go.")
                  : (lang === "nl" ? "Actie vereist — bekijk uw taken hieronder." : lang === "fa" ? "نیاز به اقدام — وظایف خود را بررسی کنید." : "Action required — check your tasks below.")}
            </div>
          </div>
        )}

        {/* CTA cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
          <Link to="/client/tasks" style={{ textDecoration: "none" }}>
            <div className="card portal-cta-card" style={{ padding: "var(--sp-5)", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", marginBottom: "var(--sp-3)" }}>
                <CheckSquare size={18} />
              </div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-1)", letterSpacing: "-0.02em" }}>{t("tasks", lang)}</div>
              {taskSummary && (
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-3)" }}>
                  {taskSummary.total - taskSummary.completed} {t("open", lang)}
                </div>
              )}
              <span style={{ fontSize: "var(--text-sm)", color: "var(--blue)", fontWeight: 600 }}>{t("viewTasks", lang)} →</span>
            </div>
          </Link>

          <Link to="/client/documents" style={{ textDecoration: "none" }}>
            <div className="card portal-cta-card" style={{ padding: "var(--sp-5)", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", marginBottom: "var(--sp-3)" }}>
                <FolderOpen size={18} />
              </div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-1)", letterSpacing: "-0.02em" }}>{t("documents", lang)}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-3)" }}>{t("uploadView", lang)}</div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--blue)", fontWeight: 600 }}>{t("viewDocs", lang)} →</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
