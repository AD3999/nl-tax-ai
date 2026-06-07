import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { fetchClientTasks } from "../../api/portal/client";

interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  required: boolean;
  status: string;
  priority: string;
}

const STATUS_COLOR: Record<string, string> = {
  todo: "var(--ink-4)", waiting_client: "oklch(0.62 0.13 50)",
  uploaded: "var(--sage-600)", needs_review: "oklch(0.62 0.13 50)",
  accepted: "var(--sage-600)", rejected: "var(--danger)", waived: "var(--ink-4)",
};

const TX = {
  title:    { nl: "Mijn taken", en: "My tasks", fa: "وظایف من" },
  back:     { nl: "← Terug", en: "← Back", fa: "← بازگشت" },
  done:     { nl: "Voltooid", en: "Done", fa: "انجام شده" },
  required: { nl: "Vereist", en: "Required", fa: "ضروری" },
  allDone:  { nl: "Alle taken voltooid!", en: "All tasks done!", fa: "تمام وظایف انجام شد!" },
  empty:    { nl: "Geen taken gevonden.", en: "No tasks found.", fa: "وظیفه‌ای یافت نشد." },
};

function t(key: keyof typeof TX, lang: "nl" | "en" | "fa") { return TX[key][lang]; }

export default function ClientTasksPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [readiness, setReadiness] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    const result = await fetchClientTasks();
    setTasks((result.tasks as Task[]) || []);
    setTotal(result.total);
    setCompleted(result.completed);
    setReadiness(result.readiness_score);
    setLoading(false);
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>Loading...</main>
  );

  const openTasks  = tasks.filter(t => !["accepted","waived"].includes(t.status));
  const doneTasks  = tasks.filter(t => ["accepted","waived"].includes(t.status));

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        <Link to="/client" style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", textDecoration: "none" }}>{t("back", lang)}</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "var(--sp-3) 0 var(--sp-5)" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>{t("title", lang)}</h1>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>{completed}/{total} {t("done", lang)}</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--hairline)", marginBottom: "var(--sp-5)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readiness}%`, background: readiness >= 85 ? "var(--sage-600)" : "oklch(0.62 0.13 50)", borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>

        {tasks.length === 0 && (
          <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{t("empty", lang)}</div>
        )}

        {openTasks.length > 0 && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            {openTasks.map(task => (
              <div key={task.id} className="card" style={{
                padding: "var(--sp-4)", marginBottom: "var(--sp-2)",
                borderInlineStart: `3px solid ${task.required ? "var(--danger)" : "var(--hairline)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
                      {task.required && <span style={{ color: "var(--danger)", marginInlineEnd: 4 }}>*</span>}
                      {task.title}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{task.description}</div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                      <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{task.category}</span>
                      {task.required && <span className="pill" style={{ fontSize: "var(--text-2xs)", color: "var(--danger)", background: "oklch(0.95 0.03 25)" }}>{t("required", lang)}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[task.status], marginInlineStart: "var(--sp-3)", flexShrink: 0 }}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {doneTasks.length > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--sp-3)" }}>
              {t("done", lang)} ({doneTasks.length})
            </div>
            {doneTasks.map(task => (
              <div key={task.id} style={{ padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-1)", opacity: 0.6, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--hairline)", fontSize: "var(--text-sm)" }}>
                <span style={{ textDecoration: "line-through", color: "var(--ink-3)" }}>{task.title}</span>
                <span style={{ color: "var(--sage-600)", fontSize: "var(--text-xs)" }}>✓</span>
              </div>
            ))}
          </div>
        )}

        {openTasks.length === 0 && tasks.length > 0 && (
          <div className="card" style={{ padding: "var(--sp-5)", textAlign: "center", background: "var(--accent-soft)", marginTop: "var(--sp-4)" }}>
            <div style={{ fontSize: "var(--text-xl)", marginBottom: "var(--sp-2)" }}>🎉</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", color: "var(--sage-600)" }}>{t("allDone", lang)}</div>
          </div>
        )}
      </div>
    </main>
  );
}
