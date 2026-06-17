import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { fetchSnapshots, saveSnapshot, type YearSnapshot } from "../api/snapshots";
import { useMobile } from "../hooks/useMobile";
import { formatEur, formatDate } from "../lib/utils";

function delta(curr: number | null, prev: number | null): { abs: number; pct: number } | null {
  if (curr == null || prev == null || prev === 0) return null;
  return { abs: curr - prev, pct: ((curr - prev) / prev) * 100 };
}

function DeltaChip({ d, invert = false }: { d: ReturnType<typeof delta>; invert?: boolean }) {
  if (!d) return null;
  const up = d.abs > 0;
  const color = invert ? (up ? "var(--ok)" : "var(--danger)") : (up ? "var(--danger)" : "var(--ok)");
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, marginInlineStart: 6 }}>
      {up ? "▲" : "▼"} {Math.abs(d.pct).toFixed(1)}%
    </span>
  );
}

function SnapshotCard({
  snap,
  prev,
  lang,
}: {
  snap: YearSnapshot;
  prev: YearSnapshot | null;
  lang: string;
}) {
  const taxDelta    = delta(snap.total_tax_due,  prev?.total_tax_due  ?? null);
  const rateDelta   = delta(snap.effective_rate, prev?.effective_rate ?? null);
  const reserveDelta = delta(snap.monthly_reserve, prev?.monthly_reserve ?? null);

  const labels: Record<string, Record<string, string>> = {
    tax:     { nl: "Totale belasting", en: "Total tax",      fa: "کل مالیات" },
    rate:    { nl: "Effectief tarief", en: "Effective rate", fa: "نرخ مؤثر" },
    reserve: { nl: "Maandreserve",     en: "Monthly reserve", fa: "ذخیره ماهانه" },
    saved:   { nl: "Opgeslagen",       en: "Saved",          fa: "ذخیره شده" },
    final:   { nl: "Definitief",       en: "Final",          fa: "نهایی" },
  };
  const L = (k: string) => labels[k]?.[lang] ?? labels[k]?.en ?? k;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Card header */}
      <div style={{
        padding: "16px 20px 14px",
        background: "var(--ink)",
        color: "var(--paper)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--sage-300)", marginBottom: 4 }}>
            {snap.tax_year}
            {snap.user_type && ` · ${snap.user_type.toUpperCase()}`}
          </div>
          {snap.total_tax_due != null && (
            <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {formatEur(Math.round(snap.total_tax_due))}
            </div>
          )}
        </div>
        {snap.is_final && (
          <span className="pill pill-ok" style={{ fontSize: 10 }}>{L("final")}</span>
        )}
      </div>

      {/* Metrics */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Tax row (already in header, show delta only) */}
        {taxDelta && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{L("tax")} vs {prev!.tax_year}</span>
            <DeltaChip d={taxDelta} />
          </div>
        )}

        {snap.effective_rate != null && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{L("rate")}</span>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span className="font-mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                {(snap.effective_rate * 100).toFixed(1)}%
              </span>
              <DeltaChip d={rateDelta} />
            </span>
          </div>
        )}

        {snap.monthly_reserve != null && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{L("reserve")}</span>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span className="font-mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                {formatEur(Math.round(snap.monthly_reserve))}/mo
              </span>
              <DeltaChip d={reserveDelta} />
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid var(--hairline)", fontSize: 11, color: "var(--ink-4)" }}>
        {L("saved")}: {formatDate(snap.created_at)}
      </div>
    </div>
  );
}

export default function TaxHistoryPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "nl" | "en" | "fa";
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMobile();

  const [snapshots, setSnapshots] = useState<YearSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchSnapshots()
      .then(data => setSnapshots(data.sort((a, b) => b.tax_year - a.tax_year)))
      .catch(() => setError("Could not load snapshots"))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await saveSnapshot({ tax_year: 2026 });
      const msg: Record<string, string> = {
        nl: res.created ? "Snapshot opgeslagen" : "Snapshot bijgewerkt",
        en: res.created ? "Snapshot saved" : "Snapshot updated",
        fa: res.created ? "اسنپ‌شات ذخیره شد" : "اسنپ‌شات به‌روز شد",
      };
      setSaveMsg(msg[lang] ?? msg.en);
      // Refresh
      const data = await fetchSnapshots();
      setSnapshots(data.sort((a, b) => b.tax_year - a.tax_year));
    } catch {
      setSaveMsg("Error saving snapshot");
    } finally {
      setSaving(false);
    }
  }

  const T = {
    title:       { nl: "Belastinggeschiedenis",         en: "Tax History",                  fa: "تاریخچه مالیاتی" },
    subtitle:    { nl: "Vergelijk uw belastingjaren",   en: "Compare your tax years",       fa: "مقایسه سال‌های مالیاتی" },
    save:        { nl: "2026-snapshot opslaan",          en: "Save 2026 snapshot",           fa: "ذخیره اسنپ‌شات ۲۰۲۶" },
    saving:      { nl: "Opslaan...",                    en: "Saving...",                     fa: "در حال ذخیره..." },
    empty_title: { nl: "Nog geen snapshots",            en: "No snapshots yet",              fa: "هنوز اسنپ‌شاتی ندارید" },
    empty_body:  { nl: "Bereken eerst uw belasting, dan sla hier een snapshot op", en: "Calculate your taxes first, then save a snapshot here", fa: "ابتدا مالیات‌تان را محاسبه کنید، سپس اینجا ذخیره کنید" },
    calc_cta:    { nl: "Naar rekenmachine",             en: "Go to calculator",              fa: "رفتن به محاسبه‌گر" },
    login_title: { nl: "Log in om uw geschiedenis te bekijken", en: "Log in to view your history", fa: "وارد شوید تا تاریخچه‌تان را ببینید" },
    login_cta:   { nl: "Inloggen",                      en: "Log in",                       fa: "ورود" },
  };
  const L = (k: keyof typeof T) => T[k][lang] ?? T[k].en;

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow eyebrow-accent" style={{ marginBottom: 8 }}>
            {t("nav.dashboard")} / {L("title")}
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 28 : 36, color: "var(--ink)", fontWeight: 400, margin: 0, letterSpacing: "-0.02em" }}>
            {L("title")}
          </h1>
          <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
            {L("subtitle")}
          </p>
        </div>
        {user && (
          <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? L("saving") : L("save")}
          </button>
        )}
      </div>

      {saveMsg && (
        <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: "var(--r-sm)", background: "var(--ok-soft)", color: "var(--ok)", fontSize: 13 }}>
          {saveMsg}
        </div>
      )}

      {!user ? (
        /* Not logged in */
        <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--ink)" }}>{L("login_title")}</div>
          <button className="btn btn-accent" onClick={() => navigate("/login")}>{L("login_cta")}</button>
        </div>
      ) : loading ? (
        <div style={{ color: "var(--ink-3)", fontSize: 14 }}>Loading...</div>
      ) : error ? (
        <div style={{ color: "var(--danger)", fontSize: 14 }}>{error}</div>
      ) : snapshots.length === 0 ? (
        /* Empty state */
        <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>📅</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--ink)" }}>{L("empty_title")}</div>
          <div style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: 360 }}>{L("empty_body")}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-accent" onClick={() => navigate("/intake")}>{L("calc_cta")}</button>
            <button className="btn btn-ghost" onClick={handleSave} disabled={saving}>{saving ? L("saving") : L("save")}</button>
          </div>
        </div>
      ) : (
        /* Snapshot grid */
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {snapshots.map((snap, idx) => {
            const prev = snapshots[idx + 1] ?? null;
            return <SnapshotCard key={snap.id} snap={snap} prev={prev} lang={lang} />;
          })}
        </div>
      )}
    </div>
  );
}
