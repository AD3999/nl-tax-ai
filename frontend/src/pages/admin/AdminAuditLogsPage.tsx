import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/hooks/useMobile";

interface AuditEntry {
  id: number;
  created_at: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  ip_address: string;
  extra: Record<string, unknown>;
}

const ACTION_COLORS: Record<string, string> = {
  create: "var(--ok)",
  update: "var(--blue)",
  delete: "var(--danger)",
  login:  "var(--warn)",
  approve: "var(--ok)",
  reject: "var(--danger)",
};

export default function AdminAuditLogsPage() {
  const { i18n } = useTranslation();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";
  const isMobile = useMobile();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const T = {
    title:    { nl: "Auditlogboek",          en: "Audit Logs",          fa: "گزارش حسابرسی" },
    subtitle: { nl: "Alle systeem- en gebruikersacties", en: "All system and user actions", fa: "همه اقدامات سیستمی و کاربری" },
    actor:    { nl: "Gebruiker",             en: "Actor",               fa: "کاربر" },
    action:   { nl: "Actie",                 en: "Action",              fa: "اقدام" },
    entity:   { nl: "Object",               en: "Entity",              fa: "موجودیت" },
    time:     { nl: "Tijd",                  en: "Time",                fa: "زمان" },
    ip:       { nl: "IP-adres",              en: "IP address",          fa: "آدرس IP" },
    all:      { nl: "Alle",                  en: "All",                 fa: "همه" },
    search:   { nl: "Zoek in logs…",         en: "Search logs…",        fa: "جستجو در گزارش‌ها…" },
    empty:    { nl: "Geen logitems",         en: "No log entries",      fa: "هیچ ورودی گزارشی وجود ندارد" },
    total:    { nl: "Totale acties",         en: "Total actions",       fa: "مجموع اقدامات" },
  };
  const t = (k: keyof typeof T) => T[k][lang];

  function loadLogs() {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    fetch("/api/admin/audit-logs/", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() as Promise<AuditEntry[] | { results: AuditEntry[] }> : Promise.reject("Failed"))
      .then(data => setLogs(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLogs(); }, []);

  const actions = ["all", ...Array.from(new Set(logs.map(l => l.action)))];

  const filtered = logs.filter(l =>
    (actionFilter === "all" || l.action === actionFilter) &&
    (l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
     l.action.toLowerCase().includes(search.toLowerCase()) ||
     l.entity_type?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "var(--sp-6)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-1)" }}>
          <ClipboardList size={24} style={{ color: "var(--blue)" }} />
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>{t("title")}</h1>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: 0 }}>{t("subtitle")}</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        {[
          { label: t("total"),   value: logs.length },
          { label: "Creates",   value: logs.filter(l => l.action === "create").length },
          { label: "Updates",   value: logs.filter(l => l.action === "update").length },
          { label: "Deletes",   value: logs.filter(l => l.action === "delete").length },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{kpi.label}</div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-4)", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search")}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingBlock: 8, background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <Filter size={14} style={{ color: "var(--text-4)", flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {actions.slice(0, 6).map(a => (
            <button key={a} onClick={() => setActionFilter(a)}
              style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                background: actionFilter === a ? "var(--blue)" : "transparent",
                color: actionFilter === a ? "#fff" : "var(--text-3)",
                border: `1px solid ${actionFilter === a ? "var(--blue)" : "var(--border-2)"}`,
              }}>
              {a}
            </button>
          ))}
        </div>
        <button
          style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center", flexShrink: 0 }}
          onClick={loadLogs}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Log entries */}
      {loading ? (
        <div style={{ padding: "var(--sp-10)", textAlign: "center", color: "var(--text-3)" }}>
          {lang === "fa" ? "در حال بارگذاری..." : lang === "nl" ? "Laden..." : "Loading..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "var(--sp-10)", textAlign: "center" }}>
          <ClipboardList size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--text-3)", fontSize: "var(--text-sm)" }}>{t("empty")}</div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-2)" }}>
                {[t("time"), t("actor"), t("action"), t("entity"), t("ip")].map(h => (
                  <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 700, color: "var(--text-3)", fontSize: "var(--text-xs)", textAlign: "start", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--border-2)" }}>
                  <td style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--text-4)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--text-2)", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.actor_email || "system"}
                  </td>
                  <td style={{ padding: "var(--sp-2) var(--sp-4)" }}>
                    <span style={{
                      fontSize: "var(--text-xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      color: ACTION_COLORS[log.action] ?? "var(--text-3)",
                      background: "var(--bg-3)",
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--text-3)", fontSize: "var(--text-xs)" }}>
                    {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}
                  </td>
                  <td style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--text-4)", fontSize: "var(--text-xs)", fontFamily: "monospace" }}>
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
