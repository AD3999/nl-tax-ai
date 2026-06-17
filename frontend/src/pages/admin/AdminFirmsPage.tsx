import { useEffect, useState } from "react";
import { Building2, Users, RefreshCw, Search, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/hooks/useMobile";
import { formatDate } from "@/lib/utils";

interface Firm {
  id: number;
  name: string;
  slug: string;
  plan: string;
  user_count: number;
  created_at: string;
  is_active: boolean;
}

export default function AdminFirmsPage() {
  const { i18n } = useTranslation();
  const lang = (["nl", "fa"].includes(i18n.language) ? i18n.language : "en") as "nl" | "en" | "fa";
  const isMobile = useMobile();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const T = {
    title:    { nl: "Kantoren",        en: "Firms",          fa: "دفاتر" },
    subtitle: { nl: "Alle firma's en teams beheren", en: "Manage all firms and teams", fa: "مدیریت همه دفاتر و تیم‌ها" },
    name:     { nl: "Naam",            en: "Name",           fa: "نام" },
    plan:     { nl: "Abonnement",      en: "Plan",           fa: "پلن" },
    users:    { nl: "Gebruikers",      en: "Users",          fa: "کاربران" },
    created:  { nl: "Aangemaakt",      en: "Created",        fa: "ایجاد شده" },
    status:   { nl: "Status",          en: "Status",         fa: "وضعیت" },
    active:   { nl: "Actief",          en: "Active",         fa: "فعال" },
    inactive: { nl: "Inactief",        en: "Inactive",       fa: "غیرفعال" },
    search:   { nl: "Zoek kantoor…",   en: "Search firm…",   fa: "جستجوی دفتر…" },
    add:      { nl: "Kantoor toevoegen", en: "Add firm",     fa: "افزودن دفتر" },
    empty:    { nl: "Geen kantoren gevonden", en: "No firms found", fa: "دفتری یافت نشد" },
    total:    { nl: "Totaal kantoren", en: "Total firms",    fa: "مجموع دفاتر" },
  };
  const t = (k: keyof typeof T) => T[k][lang];

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    fetch("/api/admin/firms/", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() as Promise<Firm[]> : Promise.reject("Failed"))
      .then(data => setFirms(Array.isArray(data) ? data : (data as { results?: Firm[] }).results ?? []))
      .catch(() => setFirms([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = firms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.slug.includes(search.toLowerCase()));

  return (
    <div style={{ padding: "var(--sp-6)", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-1)" }}>
          <Building2 size={24} style={{ color: "var(--blue)" }} />
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>{t("title")}</h1>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", margin: 0 }}>{t("subtitle")}</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        {[
          { label: t("total"),   value: firms.length,                            color: "var(--blue)", icon: <Building2 size={16} /> },
          { label: t("active"),  value: firms.filter(f => f.is_active).length,   color: "var(--ok)",   icon: <Users size={16} /> },
          { label: t("users"),   value: firms.reduce((s, f) => s + f.user_count, 0), color: "var(--warn)", icon: <Users size={16} /> },
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

      {/* Search + add */}
      <div style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-4)", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search")}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingBlock: 8, background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--text-sm)", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <button
          className="btn btn-accent btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => {/* future: open add-firm modal */}}
        >
          <Plus size={14} /> {t("add")}
        </button>
        <button
          style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}
          onClick={() => { setLoading(true); setFirms([]); setTimeout(() => setLoading(false), 600); }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "var(--sp-10)", textAlign: "center", color: "var(--text-3)" }}>
          {lang === "fa" ? "در حال بارگذاری..." : lang === "nl" ? "Laden..." : "Loading..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "var(--sp-10)", textAlign: "center" }}>
          <Building2 size={32} style={{ opacity: 0.3, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--text-3)", fontSize: "var(--text-sm)" }}>{t("empty")}</div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-2)" }}>
                {[t("name"), t("plan"), t("users"), t("created"), t("status")].map(h => (
                  <th key={h} style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 700, color: "var(--text-3)", fontSize: "var(--text-xs)", textAlign: "start", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(firm => (
                <tr key={firm.id} style={{ borderBottom: "1px solid var(--border-2)" }}>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{firm.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-4)" }}>{firm.slug}</div>
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                    <span className="pill" style={{ fontSize: "var(--text-2xs)" }}>{firm.plan}</span>
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--text-2)", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={12} style={{ color: "var(--text-4)" }} />
                      {firm.user_count}
                    </div>
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)", color: "var(--text-3)", fontSize: "var(--text-xs)" }}>
                    {formatDate(firm.created_at)}
                  </td>
                  <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                    <span style={{
                      display: "inline-block", fontSize: "var(--text-xs)", fontWeight: 700,
                      padding: "2px 10px", borderRadius: 999,
                      background: firm.is_active ? "var(--ok-subtle, oklch(from var(--ok) l c h / 0.12))" : "var(--bg-3)",
                      color: firm.is_active ? "var(--ok)" : "var(--text-4)",
                    }}>
                      {firm.is_active ? t("active") : t("inactive")}
                    </span>
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
