import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { fetchClientTasks } from "../../api/portal/client";

interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  status: string;
  priority: string;
}

type Lang = "nl" | "en" | "fa";

const STATUS_COLOR: Record<string, string> = {
  todo: "var(--ink-4)", waiting_client: "oklch(0.62 0.13 50)",
  uploaded: "var(--sage-600)", needs_review: "oklch(0.62 0.13 50)",
  accepted: "var(--sage-600)", rejected: "var(--danger)", waived: "var(--ink-4)",
};

const TX: Record<Lang, Record<string, string>> = {
  en: {
    title:           "My tasks",
    back:            "← Back",
    done_section:    "Done",
    required:        "Required",
    all_done:        "All tasks done!",
    empty:           "No tasks found.",
    loading:         "Loading...",
    error:           "Could not load tasks.",
    ask_ai:          "Ask AI",
    status_todo:            "To do",
    status_waiting_client:  "Waiting for client",
    status_uploaded:        "Uploaded",
    status_needs_review:    "Needs review",
    status_accepted:        "Accepted",
    status_rejected:        "Rejected",
    status_waived:          "Waived",
    cat_identity:    "Identity",
    cat_income:      "Income",
    cat_expenses:    "Expenses",
    cat_deductions:  "Deductions",
    cat_bank:        "Bank",
    cat_other:       "Other",
    pri_high:        "High",
    pri_medium:      "Medium",
    pri_low:         "Low",
    completed_of:    "completed of",
  },
  nl: {
    title:           "Mijn taken",
    back:            "← Terug",
    done_section:    "Voltooid",
    required:        "Vereist",
    all_done:        "Alle taken voltooid!",
    empty:           "Geen taken gevonden.",
    loading:         "Laden...",
    error:           "Taken konden niet worden geladen.",
    ask_ai:          "Vraag AI",
    status_todo:            "Te doen",
    status_waiting_client:  "Wacht op klant",
    status_uploaded:        "Geüpload",
    status_needs_review:    "Beoordeling nodig",
    status_accepted:        "Geaccepteerd",
    status_rejected:        "Afgewezen",
    status_waived:          "Vrijgesteld",
    cat_identity:    "Identiteit",
    cat_income:      "Inkomsten",
    cat_expenses:    "Kosten",
    cat_deductions:  "Aftrekposten",
    cat_bank:        "Bank",
    cat_other:       "Overig",
    pri_high:        "Hoog",
    pri_medium:      "Gemiddeld",
    pri_low:         "Laag",
    completed_of:    "voltooid van",
  },
  fa: {
    title:           "وظایف من",
    back:            "← بازگشت",
    done_section:    "انجام شده",
    required:        "ضروری",
    all_done:        "تمام وظایف انجام شد!",
    empty:           "وظیفه‌ای یافت نشد.",
    loading:         "در حال بارگذاری...",
    error:           "بارگذاری وظایف ناموفق بود.",
    ask_ai:          "پرسش از AI",
    status_todo:            "در انتظار",
    status_waiting_client:  "منتظر مشتری",
    status_uploaded:        "بارگذاری شده",
    status_needs_review:    "نیاز به بررسی",
    status_accepted:        "پذیرفته شده",
    status_rejected:        "رد شده",
    status_waived:          "معاف شده",
    cat_identity:    "هویت",
    cat_income:      "درآمد",
    cat_expenses:    "هزینه‌ها",
    cat_deductions:  "کسورات",
    cat_bank:        "بانک",
    cat_other:       "سایر",
    pri_high:        "بالا",
    pri_medium:      "متوسط",
    pri_low:         "پایین",
    completed_of:    "تکمیل از",
  },
};

function statusLabel(status: string, tx: Record<string, string>): string {
  return tx[`status_${status}`] ?? status;
}

function categoryLabel(cat: string, tx: Record<string, string>): string {
  return tx[`cat_${cat}`] ?? cat;
}

export default function ClientTasksPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as Lang;
  const tx = TX[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [readiness, setReadiness] = useState(0);
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
      const result = await fetchClientTasks();
      setTasks((result.tasks as Task[]) || []);
      setTotal(result.total);
      setCompleted(result.completed);
      setReadiness(result.readiness_score);
      setLastUpdated(new Date());
      if (!silent) setError("");
    } catch {
      if (!silent) setError(tx.error);
    }
    if (!silent) setLoading(false);
  }

  function handleAskAI(task: Task) {
    const question = `${task.title}${task.description ? `. ${task.description}` : ""}`;
    navigate("/chat", { state: { question } });
  }

  if (loading) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center", color: "var(--ink-4)" }}>{tx.loading}</main>
  );

  if (error && tasks.length === 0) return (
    <main style={{ flex: 1, padding: "var(--sp-8)", textAlign: "center" }}>
      <p style={{ color: "var(--danger)" }}>{error}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => void load()} style={{ marginTop: 8 }}>↻ Retry</button>
    </main>
  );

  const openTasks = tasks.filter(t => !["accepted", "waived"].includes(t.status));
  const doneTasks = tasks.filter(t => ["accepted", "waived"].includes(t.status));

  return (
    <main style={{ background: "var(--paper)", flex: 1 }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "var(--sp-8) var(--sp-6)" }}>

        <Link to="/client" style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", textDecoration: "none" }}>{tx.back}</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "var(--sp-3) 0 var(--sp-5)" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-3xl)", fontWeight: 400, color: "var(--ink)", margin: 0 }}>{tx.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>{completed} {tx.completed_of} {total}</span>
            {lastUpdated && <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => void load(true)} title="Refresh" style={{ background: "none", border: "1px solid var(--hairline-2)", borderRadius: 6, cursor: "pointer", color: "var(--ink-4)", fontSize: 13, padding: "2px 7px", lineHeight: 1 }}>↻</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--hairline)", marginBottom: "var(--sp-5)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readiness}%`, background: readiness >= 85 ? "var(--sage-600)" : "oklch(0.62 0.13 50)", borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>

        {tasks.length === 0 && (
          <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--ink-3)" }}>{tx.empty}</div>
        )}

        {/* Open tasks */}
        {openTasks.length > 0 && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            {openTasks.map(task => (
              <div key={task.id} className="card" style={{
                padding: "var(--sp-4)", marginBottom: "var(--sp-2)",
                borderInlineStart: `3px solid ${task.required ? "var(--danger)" : "var(--hairline)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
                      {task.required && <span style={{ color: "var(--danger)", marginInlineEnd: 4 }}>*</span>}
                      {task.title}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 4 }}>{task.description}</div>
                    <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", flexWrap: "wrap" }}>
                      <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{categoryLabel(task.category, tx)}</span>
                      {task.required && (
                        <span className="pill" style={{ fontSize: "var(--text-2xs)", color: "var(--danger)", background: "oklch(0.95 0.03 25)" }}>{tx.required}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-xs)", color: STATUS_COLOR[task.status] }}>
                      {statusLabel(task.status, tx)}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "var(--text-2xs)", border: "1px solid var(--sage-600)", color: "var(--sage-600)", padding: "2px 10px" }}
                      onClick={() => handleAskAI(task)}
                      title={tx.ask_ai}
                    >
                      {tx.ask_ai}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--sp-3)" }}>
              {tx.done_section} ({doneTasks.length})
            </div>
            {doneTasks.map(task => (
              <div key={task.id} style={{ padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-1)", opacity: 0.6, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--hairline)", fontSize: "var(--text-sm)" }}>
                <span style={{ textDecoration: "line-through", color: "var(--ink-3)" }}>{task.title}</span>
                <span style={{ color: "var(--sage-600)", fontSize: "var(--text-xs)" }}>✓</span>
              </div>
            ))}
          </div>
        )}

        {/* All done celebration */}
        {openTasks.length === 0 && tasks.length > 0 && (
          <div className="card" style={{ padding: "var(--sp-5)", textAlign: "center", background: "var(--accent-soft)", marginTop: "var(--sp-4)" }}>
            <div style={{ fontSize: "var(--text-xl)", marginBottom: "var(--sp-2)" }}>🎉</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: "var(--text-xl)", color: "var(--sage-600)" }}>{tx.all_done}</div>
          </div>
        )}
      </div>
    </main>
  );
}
