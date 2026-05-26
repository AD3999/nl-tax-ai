import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "../api/payments";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

const COMPARISON_ROWS = [
  ["Chat questions",     "10/day", "∞"],
  ["Full simulation",   "—",      "✓"],
  ["Saved scenarios",   "1",      "∞"],
  ["PDF export",         "—",      "✓"],
] as const;

interface Props {
  reason: "session_limit" | "daily_limit" | "register";
  onClose: () => void;
}

export default function UpgradeModal({ reason, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAnon = !user;
  const isRegisterPrompt = reason === "register" || isAnon;

  const headlineMap = {
    session_limit: t("upgrade.headline_session"),
    daily_limit:   t("upgrade.headline_daily"),
    register:      t("upgrade.headline_register"),
  };

  const handleUpgrade = async () => {
    if (isRegisterPrompt) {
      navigate("/register");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setError(t("upgrade.error"));
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 20, background: "rgba(20,18,14,0.40)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: 440, padding: 28, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", animation: "cardIn .2s ease-out both" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ width: 40, height: 40, borderRadius: 999, background: "var(--accent-soft)", color: "var(--sage-700)", display: "grid", placeItems: "center", fontSize: 18 }}>
            ⚡
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid var(--hairline)", background: "var(--paper)", display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            <Icon.x style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Headline */}
        <h2 style={{ marginTop: 18, fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.015em", lineHeight: 1.15 }}>
          {headlineMap[reason] ?? headlineMap.session_limit}
        </h2>
        <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>
          {isRegisterPrompt
            ? t("upgrade.subheadline_register")
            : t("upgrade.subheadline_upgrade")}
        </p>

        {/* Comparison table */}
        <div style={{ marginTop: 18, padding: 14, background: "var(--paper-3)", borderRadius: "var(--r)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            <span />
            <span style={{ textAlign: "center" }}>Free</span>
            <span style={{ textAlign: "center", color: "var(--sage-700)" }}>Premium</span>
          </div>
          {COMPARISON_ROWS.map(([k, a, b], i) => (
            <div key={k} style={{ padding: "8px 0", borderTop: i === 0 ? "1px solid var(--hairline)" : "1px solid var(--hairline)", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: "var(--ink-2)" }}>{k}</span>
              <span className="num" style={{ textAlign: "center", color: "var(--ink-3)" }}>{a}</span>
              <span className="num" style={{ textAlign: "center", color: "var(--sage-700)", fontWeight: 600 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        {!isRegisterPrompt && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span className="font-serif" style={{ fontSize: 36, color: "var(--ink)" }}>€9.99</span>
            <span style={{ fontSize: 14, color: "var(--ink-3)" }}> / month</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--danger-soft)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* CTAs */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            className="btn btn-accent btn-lg"
            type="button"
            style={{ width: "100%" }}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "…" : isRegisterPrompt ? t("upgrade.cta_register") : <>Upgrade — €9.99 / month <Icon.arrow /></>}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ width: "100%", height: 36, fontSize: 13 }}
            onClick={onClose}
          >
            {t("upgrade.maybe_later")}
          </button>
        </div>

        <p style={{ marginTop: 12, fontSize: 11, color: "var(--ink-4)", textAlign: "center" }}>
          Secure checkout · Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
