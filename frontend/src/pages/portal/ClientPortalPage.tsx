import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckSquare, FolderOpen, AlertTriangle, Wrench, RefreshCw, User, TrendingUp, FileWarning, MessageSquare, Bot } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { fetchClientProfile, fetchClientEngagement, fetchClientTasks } from "../../api/portal/client";
import type { ClientProfile, TaxEngagement } from "../../api/portal/types";
import ReadinessCard from "../../components/ui/ReadinessCard";

const TX = {
  title:          { nl: "Mijn Belastingportaal", en: "My Tax Portal", fa: "پورتال مالیاتی من" },
  welcome:        { nl: "Welkom", en: "Welcome", fa: "خوش آمدید" },
  readiness:      { nl: "Gereedheid", en: "Readiness", fa: "آمادگی" },
  tasks:          { nl: "Taken", en: "Tasks", fa: "وظایف" },
  documents:      { nl: "Documenten", en: "Documents", fa: "اسناد" },
  open:           { nl: "Openstaand", en: "Open", fa: "باز" },
  status:         { nl: "Status", en: "Status", fa: "وضعیت" },
  year:           { nl: "Belastingjaar", en: "Tax year", fa: "سال مالیاتی" },
  type:           { nl: "Type", en: "Type", fa: "نوع" },
  viewTasks:      { nl: "Bekijk taken", en: "View tasks", fa: "مشاهده وظایف" },
  viewDocs:       { nl: "Bekijk documenten", en: "View documents", fa: "مشاهده اسناد" },
  noEng:          { nl: "Geen actieve aangifte gevonden. Neem contact op met uw accountant.", en: "No active engagement found. Contact your accountant.", fa: "هیچ تعاملی یافت نشد. با حسابدار خود تماس بگیرید." },
  uploadView:     { nl: "Uploaden & bekijken", en: "Upload & view", fa: "بارگذاری و مشاهده" },
  settingUp:      { nl: "Portal instellen…", en: "Setting up your portal…", fa: "در حال راه‌اندازی پورتال…" },
  retry:          { nl: "Opnieuw proberen", en: "Retry", fa: "تلاش مجدد" },
  missingDocs:    { nl: "Ontbrekende documenten", en: "Missing documents", fa: "اسناد ناقص" },
  uploadNow:      { nl: "Nu uploaden", en: "Upload now", fa: "همین حالا بارگذاری کنید" },
  openTasks:      { nl: "Openstaande taken", en: "Open tasks", fa: "وظایف باز" },
  yourAccountant: { nl: "Uw accountant", en: "Your accountant", fa: "حسابدار شما" },
  notAssigned:    { nl: "Nog niet toegewezen", en: "Not yet assigned", fa: "هنوز تعیین نشده" },
  taxYear:        { nl: "Belastingjaar", en: "Tax year", fa: "سال مالیاتی" },
  engStatus:      { nl: "Aangiftestatus", en: "Filing status", fa: "وضعیت اظهارنامه" },
  sendMessage:    { nl: "Bericht sturen", en: "Send message", fa: "ارسال پیام" },
  continuePrep:   { nl: "Doorgaan met voorbereiding", en: "Continue tax preparation", fa: "ادامه آماده‌سازی" },
  askAI:          { nl: "Vraag de AI", en: "Ask AI", fa: "از هوش مصنوعی بپرسید" },
  aiTasksQ:       {
    nl: "Ik heb openstaande belastingtaken in mijn portaal. Welke taken zijn het meest urgent en hoe voltooi ik ze stap voor stap in TaxWijs?",
    en: "I have open tax tasks in my portal. Which tasks are most urgent and how do I complete them step by step in TaxWijs?",
    fa: "وظایف مالیاتی باز در پورتالم دارم. کدام وظایف فوری‌ترند و چطور آنها را گام به گام در TaxWijs کامل کنم؟",
  },
  aiDocsQ:        {
    nl: "Ik moet documenten uploaden in mijn belastingportaal. Welke documenten heb ik nodig en hoe upload ik ze in TaxWijs?",
    en: "I need to upload documents in my tax portal. Which documents do I need and how do I upload them in TaxWijs?",
    fa: "باید اسناد را در پورتال مالیاتی‌ام آپلود کنم. به چه اسنادی نیاز دارم و چطور آنها را در TaxWijs آپلود کنم؟",
  },
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
  const navigate = useNavigate();
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
      <AlertTriangle size={40} style={{ color: "var(--warn)", margin: "0 auto 16px" }} />
      <p style={{ color: "var(--text-2)", fontSize: "var(--text-base)", marginBottom: 20 }}>{error}</p>
      <button className="btn btn-accent btn-sm" onClick={() => void load()}>{t("retry", lang)}</button>
    </main>
  );

  if (!profile || !engagement) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <Wrench size={40} style={{ color: "var(--text-3)", margin: "0 auto 16px" }} />
      <p style={{ color: "var(--text-2)", marginBottom: 20 }}>{t("settingUp", lang)}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => void load()}>{t("retry", lang)}</button>
    </main>
  );

  const score = taskSummary?.readiness_score ?? engagement.readiness_score;
  const missingCount = engagement.missing_items_count;
  const openTasks = taskSummary ? (taskSummary.total - taskSummary.completed) : 0;

  // Derive readiness factor breakdown from available data
  const readinessFactors = [
    { label: lang === "nl" ? "Documenten" : lang === "fa" ? "اسناد" : "Documents", weight: 40, score: Math.min(100, score * 1.1) },
    { label: lang === "nl" ? "Checklist" : lang === "fa" ? "چک‌لیست" : "Checklist", weight: 25, score: taskSummary ? Math.round((taskSummary.completed / Math.max(taskSummary.total, 1)) * 100) : score },
    { label: lang === "nl" ? "Verificatie" : lang === "fa" ? "تأیید" : "Verification", weight: 20, score: Math.max(0, score - 10) },
    { label: lang === "nl" ? "Accountant" : lang === "fa" ? "حسابدار" : "Accountant Review", weight: 15, score: engagement.status === "needs_review" ? 50 : engagement.status === "ready_to_file" ? 100 : 0 },
  ].map(f => ({ ...f, score: Math.round(Math.min(100, Math.max(0, f.score))) }));

  return (
    <main style={{ background: "var(--bg)", flex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        {/* Header — greeting + tax year + assigned accountant */}
        <div style={{ marginBottom: "var(--sp-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-3)" }}>
          <div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: "0 0 4px", fontWeight: 600 }}>
              {t("welcome", lang)}, {profile.display_name || profile.email}
            </p>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>
              {t("title", lang)}
            </h1>
            <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "var(--blue-subtle)", color: "var(--blue-text)" }}>
                {t("taxYear", lang)} {engagement.tax_year}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "var(--bg-3)", color: "var(--text-3)", border: "1px solid var(--border-2)" }}>
                {engagement.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>{lastUpdated.toLocaleTimeString()}</span>
            )}
            <button onClick={() => void load(true)} title="Refresh"
              style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", width: 34, height: 34, display: "grid", placeItems: "center" }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Above-the-fold row: Readiness + quick stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
          {/* Readiness card — Ch 14 labels */}
          <div style={{ gridColumn: isMobile ? "1" : "1 / 3" }}>
            <ReadinessCard score={score} factors={readinessFactors} />
          </div>

          {/* Quick stats column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {/* Open tasks */}
            <Link to="/client/tasks" style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: "var(--sp-4)", cursor: "pointer", transition: "box-shadow 180ms", borderLeft: `3px solid ${openTasks > 0 ? "var(--warn)" : "var(--ok)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                  <CheckSquare size={14} style={{ color: openTasks > 0 ? "var(--warn)" : "var(--ok)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("openTasks", lang)}</span>
                </div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text)" }}>{openTasks}</div>
                <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600, marginTop: 4 }}>{t("viewTasks", lang)} →</div>
              </div>
            </Link>

            {/* Missing documents */}
            <Link to="/client/documents" style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: "var(--sp-4)", cursor: "pointer", transition: "box-shadow 180ms", borderLeft: `3px solid ${missingCount > 0 ? "var(--danger)" : "var(--ok)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                  <FolderOpen size={14} style={{ color: missingCount > 0 ? "var(--danger)" : "var(--ok)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("missingDocs", lang)}</span>
                </div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text)" }}>{missingCount}</div>
                <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600, marginTop: 4 }}>{t("viewDocs", lang)} →</div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Middle row: Missing docs list + accountant card ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>

          {/* Missing documents actionable list */}
          {missingCount > 0 && (
            <div className="card" style={{ padding: "var(--sp-5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
                <FileWarning size={16} style={{ color: "var(--danger)" }} />
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text)" }}>{t("missingDocs", lang)}</h3>
                <span style={{ marginInlineStart: "auto", fontSize: 11, fontWeight: 700, background: "var(--danger-subtle)", color: "var(--danger-text)", padding: "2px 8px", borderRadius: 999 }}>{missingCount}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {Array.from({ length: Math.min(missingCount, 4) }, (_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-3)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-2)" }}>
                        {lang === "nl" ? `Vereist document ${i + 1}` : lang === "fa" ? `سند مورد نیاز ${i + 1}` : `Required document ${i + 1}`}
                      </span>
                    </div>
                    <Link to="/client/documents" style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textDecoration: "none" }}>{t("uploadNow", lang)}</Link>
                  </div>
                ))}
                {missingCount > 4 && (
                  <Link to="/client/documents" style={{ fontSize: "var(--text-sm)", color: "var(--blue)", fontWeight: 600, textDecoration: "none", paddingInlineStart: "var(--sp-3)" }}>
                    +{missingCount - 4} {lang === "fa" ? "بیشتر" : lang === "nl" ? "meer" : "more"} →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* If no missing docs, show a completion card */}
          {missingCount === 0 && (
            <div className="card" style={{ padding: "var(--sp-5)", display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ok-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp size={22} style={{ color: "var(--ok)" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                  {lang === "nl" ? "Alle documenten compleet!" : lang === "fa" ? "همه اسناد کامل هستند!" : "All documents complete!"}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
                  {lang === "nl" ? "Uw accountant kan nu uw dossier bekijken." : lang === "fa" ? "حسابدار شما اکنون می‌تواند پرونده شما را بررسی کند." : "Your accountant can now review your file."}
                </div>
              </div>
            </div>
          )}

          {/* Assigned accountant card */}
          <div className="card" style={{ padding: "var(--sp-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
              <User size={14} style={{ color: "var(--text-3)" }} />
              <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("yourAccountant", lang)}</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={16} style={{ color: "var(--blue)" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)" }}>
                  {lang === "nl" ? "Uw adviseur" : lang === "fa" ? "مشاور شما" : "Your advisor"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>TaxWijs</div>
              </div>
            </div>
            <Link to="/client/messages" style={{ textDecoration: "none" }}>
              <button className="btn btn-accent btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                <MessageSquare size={13} />
                {t("sendMessage", lang)}
              </button>
            </Link>
          </div>
        </div>

        {/* ── CTA action cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
          {/* Tasks card */}
          <div className="card portal-cta-card" style={{ padding: "var(--sp-5)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", marginBottom: "var(--sp-3)" }}>
              <CheckSquare size={18} />
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-1)", letterSpacing: "-0.02em" }}>{t("tasks", lang)}</div>
            {taskSummary && (
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-3)" }}>
                {openTasks} {t("open", lang)}
              </div>
            )}
            <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginTop: "var(--sp-3)" }}>
              <Link to="/client/tasks" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--blue)", fontWeight: 600 }}>{t("viewTasks", lang)} →</span>
              </Link>
              <button
                onClick={() => navigate("/chat", { state: { question: TX.aiTasksQ[lang] } })}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, marginInlineStart: "auto" }}
              >
                <Bot size={12} />
                {t("askAI", lang)}
              </button>
            </div>
          </div>

          {/* Documents card */}
          <div className="card portal-cta-card" style={{ padding: "var(--sp-5)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", marginBottom: "var(--sp-3)" }}>
              <FolderOpen size={18} />
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-1)", letterSpacing: "-0.02em" }}>{t("documents", lang)}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-3)" }}>{t("uploadView", lang)}</div>
            <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginTop: "var(--sp-3)" }}>
              <Link to="/client/documents" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--blue)", fontWeight: 600 }}>{t("viewDocs", lang)} →</span>
              </Link>
              <button
                onClick={() => navigate("/chat", { state: { question: TX.aiDocsQ[lang] } })}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, marginInlineStart: "auto" }}
              >
                <Bot size={12} />
                {t("askAI", lang)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
