import { useEffect, useState } from "react";
import { Activity, MessageSquare, AlertTriangle, TrendingUp, RefreshCw, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/hooks/useMobile";

interface AIMetrics {
  total_messages: number;
  messages_today: number;
  avg_response_ms: number;
  error_rate: number;
  top_topics: Array<{ topic: string; count: number }>;
  recent_errors: Array<{ id: string; created_at: string; error: string; model: string }>;
  model_distribution: Record<string, number>;
}

export default function AdminAIMonitoringPage() {
  const { i18n } = useTranslation();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";
  const isMobile = useMobile();

  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const T = {
    title:       { nl: "AI-monitor",             en: "AI Monitoring",         fa: "پایش هوش مصنوعی" },
    subtitle:    { nl: "Realtime statistieken van het AI-systeem", en: "Real-time AI system statistics", fa: "آمار لحظه‌ای سیستم هوش مصنوعی" },
    total_msgs:  { nl: "Totale berichten",        en: "Total messages",        fa: "مجموع پیام‌ها" },
    today:       { nl: "Berichten vandaag",       en: "Messages today",        fa: "پیام‌های امروز" },
    avg_resp:    { nl: "Gem. responstijd",         en: "Avg. response time",    fa: "میانگین زمان پاسخ" },
    error_rate:  { nl: "Foutpercentage",          en: "Error rate",            fa: "نرخ خطا" },
    top_topics:  { nl: "Populairste onderwerpen", en: "Top topics",            fa: "موضوعات پرکاربرد" },
    recent_err:  { nl: "Recente fouten",          en: "Recent errors",         fa: "خطاهای اخیر" },
    models:      { nl: "Modelgebruik",            en: "Model usage",           fa: "استفاده از مدل" },
    refreshed:   { nl: "Vernieuwd",               en: "Refreshed",             fa: "به‌روزرسانی" },
    no_errors:   { nl: "Geen recente fouten",     en: "No recent errors",      fa: "خطای اخیری وجود ندارد" },
    no_topics:   { nl: "Geen onderwerpen",        en: "No topics yet",         fa: "هنوز موضوعی وجود ندارد" },
  };
  const t = (k: keyof typeof T) => T[k][lang];

  function loadMetrics() {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    fetch("/api/admin/ai-metrics/", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() as Promise<AIMetrics> : Promise.reject("Failed"))
      .then(data => { setMetrics(data); setLastRefreshed(new Date()); })
      .catch(() => {
        // Fallback with mock-zero data so the UI doesn't crash when endpoint not yet available
        setMetrics({
          total_messages: 0, messages_today: 0, avg_response_ms: 0,
          error_rate: 0, top_topics: [], recent_errors: [], model_distribution: {},
        });
        setLastRefreshed(new Date());
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadMetrics(); }, []);

  const kpis = metrics ? [
    { label: t("total_msgs"),  value: metrics.total_messages.toLocaleString(), icon: <MessageSquare size={16} />, color: "var(--blue)" },
    { label: t("today"),       value: metrics.messages_today.toLocaleString(), icon: <TrendingUp size={16} />,    color: "var(--ok)" },
    { label: t("avg_resp"),    value: metrics.avg_response_ms > 0 ? `${metrics.avg_response_ms}ms` : "—", icon: <Clock size={16} />, color: "var(--warn)" },
    { label: t("error_rate"),  value: `${(metrics.error_rate * 100).toFixed(2)}%`, icon: <AlertTriangle size={16} />, color: "var(--danger)" },
  ] : [];

  return (
    <div style={{ padding: "var(--sp-6)", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--sp-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-1)" }}>
            <Activity size={24} style={{ color: "var(--blue)" }} />
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>{t("title")}</h1>
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: 0 }}>{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
          {lastRefreshed && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)" }}>
              {t("refreshed")}: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadMetrics}
            style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "var(--sp-10)", textAlign: "center", color: "var(--text-3)" }}>
          {lang === "fa" ? "در حال بارگذاری..." : lang === "nl" ? "Laden..." : "Loading metrics..."}
        </div>
      ) : metrics ? (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
            {kpis.map(kpi => (
              <div key={kpi.label} className="card" style={{ padding: "var(--sp-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                  <span style={{ color: kpi.color }}>{kpi.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</span>
                </div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Two-column: topics + model distribution */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
            {/* Top topics */}
            <div className="card" style={{ padding: "var(--sp-5)" }}>
              <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)", marginBottom: "var(--sp-4)", margin: "0 0 var(--sp-4)" }}>{t("top_topics")}</h3>
              {metrics.top_topics.length === 0 ? (
                <div style={{ color: "var(--text-3)", fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--sp-4)" }}>{t("no_topics")}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {metrics.top_topics.slice(0, 8).map((topic, i) => {
                    const maxCount = metrics.top_topics[0]?.count ?? 1;
                    return (
                      <div key={topic.topic} style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                        <span style={{ width: 20, fontSize: "var(--text-xs)", color: "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic.topic}</span>
                        <div style={{ width: 80, height: 6, background: "var(--border-2)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${(topic.count / maxCount) * 100}%`, background: "var(--blue)", borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{topic.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model usage */}
            <div className="card" style={{ padding: "var(--sp-5)" }}>
              <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)", margin: "0 0 var(--sp-4)" }}>{t("models")}</h3>
              {Object.keys(metrics.model_distribution).length === 0 ? (
                <div style={{ color: "var(--text-3)", fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--sp-4)" }}>—</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                  {Object.entries(metrics.model_distribution).map(([model, count]) => {
                    const total = Object.values(metrics.model_distribution).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={model}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-2)", fontWeight: 600 }}>{model}</span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-3)" }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "var(--border-2)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--blue)", borderRadius: 999, transition: "width 400ms" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent errors */}
          <div className="card" style={{ padding: "var(--sp-5)" }}>
            <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)", margin: "0 0 var(--sp-4)" }}>{t("recent_err")}</h3>
            {metrics.recent_errors.length === 0 ? (
              <div style={{ color: "var(--ok)", fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--sp-4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-2)" }}>
                <Activity size={16} /> {t("no_errors")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {metrics.recent_errors.map(err => (
                  <div key={err.id} style={{ display: "flex", gap: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--danger-subtle, oklch(from var(--danger) l c h / 0.08))", borderRadius: "var(--r-sm)", borderInlineStart: "3px solid var(--danger)" }}>
                    <AlertTriangle size={14} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 600, marginBottom: 2 }}>{err.error}</div>
                      <div style={{ display: "flex", gap: "var(--sp-3)", fontSize: "var(--text-xs)", color: "var(--text-4)" }}>
                        <span>{new Date(err.created_at).toLocaleString()}</span>
                        {err.model && <span>· {err.model}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
